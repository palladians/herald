import { KYCDepositCompliantContract } from './contracts/KYCDepositCompliantContract';
import { Field, Mina, PrivateKey, PublicKey, AccountUpdate } from 'snarkyjs';
import { loadProofJSON, convertProof } from './utils/utils';
/*
 * This file tests how to test the `KYCDepositCompliantContract` smart contract. 
 * See https://docs.minaprotocol.com/zkapps for more info.
 */

let proofsEnabled = false; // Set proofsEnabled to true for testing

describe('KYCDepositCompliantContract', () => {
  let deployerAccount: PublicKey;
  let deployerKey: PrivateKey;
  let zkAppAddress: PublicKey;
  let zkAppPrivateKey: PrivateKey;
  let zkApp: KYCDepositCompliantContract;
  let subjectPrvKey: PrivateKey;
  let subjectPubKey: PublicKey;

  beforeAll(async () => {
    if (proofsEnabled) await KYCDepositCompliantContract.compile();
  });

  beforeEach(() => {
    const local = Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(local);
    if (local.testAccounts[0] && local.testAccounts[1]) {
        ({ privateKey: deployerKey, publicKey: deployerAccount } = local.testAccounts[0]);
     } else {
        throw new Error('Test accounts are not defined');
     }
    subjectPrvKey = PrivateKey.fromBase58("EKE1c5UXWmKpzSZxkh67MPUeujYtoVppkGKrv3zC9CFXnWAzkktu")
    subjectPubKey = subjectPrvKey.toPublicKey();
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new KYCDepositCompliantContract(zkAppAddress);
  });

  async function localDeploy() {
    const deployTxn = await Mina.transaction(deployerAccount, () => {
      let setup = AccountUpdate.fundNewAccount(deployerAccount, 2);
      setup.send({ to: subjectPubKey, amount: 5e9}); // send 5 Mina to subject address
      zkApp.deploy();
    });

    await deployTxn.prove();
    await deployTxn.sign([deployerKey, zkAppPrivateKey]).send();
  }
  

  it('deploys the `KYCDepositCompliantContract` smart contract', async () => {
    await localDeploy();
    const totalDeposit = await zkApp.depositTotal.get();
    expect(totalDeposit).toEqual(Field(0));
  });
  it('can convert proof outputs into expected components', async () => {
    // Load AttestationProof
    const attestationProofJSON = loadProofJSON();
    const attestationProof = convertProof(attestationProofJSON)
    expect(attestationProof.publicOutput).toEqual(subjectPubKey)
  });
  
  it('A wallet loads an attestation proof type it is knows of, and increments the depositTotal value of the contract', async () => {
    // Load AttestationProof
    const attestationProofJSON = loadProofJSON();
    const attestationProof = convertProof(attestationProofJSON)
    expect(attestationProof).toBeDefined();

    // Define amount to deposit
    const amount = Field(100);

    // Deploy the zkApp
    await localDeploy();

    // get inital deposit value
    const initialDepositValue = await zkApp.depositTotal.get();

    // post proof to the zkApp
    const postProofTxn = await Mina.transaction(subjectPubKey, () => {
      zkApp.deposit(attestationProof, amount);
    })
    await postProofTxn.prove();
    await postProofTxn.sign([subjectPrvKey]).send();
    console.log("new state", await zkApp.depositTotal.get());
    expect(await zkApp.depositTotal.get()).toEqual(initialDepositValue.add(amount));
  });
  
  // TODO: add more interesting contracts and zkPrograms

});