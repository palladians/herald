import { ZkKYCDepositCompliantContract } from './contracts/ZkKYCDepositCompliantContract';
import { Field, Mina, PrivateKey, PublicKey, AccountUpdate, Bool, Signature, Group, Poseidon, Scalar } from 'snarkyjs';
import { StealthAddress, ZkKycClaimInputs, ZkKycClaimProgram, ZkKycProof, deriveKeyPairs } from '@herald-sdk/provable-programs';
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
  let zkApp: ZkKYCDepositCompliantContract;
  let subjectPrvKey: PrivateKey;
  let subjectPubKey: PublicKey;
  let issuerPrvKey: PrivateKey;
  let issuerPubKey: PublicKey;

  beforeAll(async () => {
    if (proofsEnabled) await ZkKYCDepositCompliantContract.compile();
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
    issuerPrvKey = PrivateKey.fromBase58("EKDhdt1SX7i1cp7KZRzqVdJDYUf16HqM4bGpUzF98jSh3hzZTZLr");
    issuerPubKey = issuerPrvKey.toPublicKey();
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new ZkKYCDepositCompliantContract(zkAppAddress);
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
  it('issuer should create a stealth address for the subject',async () => {
    // subject creates their view and spend key pairs
    const subjectKeyPairs = deriveKeyPairs(subjectPrvKey.toBase58())

    // issuer creates stealth address for the subject
    const subjectStealthAddress = new StealthAddress(PublicKey.fromBase58(subjectKeyPairs.S), PublicKey.fromBase58(subjectKeyPairs.V));
    // issuer creates public inputs
    const publicInputs = new ZkKycClaimInputs(issuerPubKey, subjectStealthAddress, Bool(true), Signature.create(issuerPrvKey, Bool(true).toFields()))
    // compile the ZkProgram
    await ZkKycClaimProgram.compile()
    // Create credential proof property
    const p = await ZkKycClaimProgram.createZkKycClaimProof(publicInputs)
    const proof = p as ZkKycProof;
    // subject can verify the proof is about them
    // Recipient computes F using their private view key and the public R value attached to the transaction.
    const F = subjectStealthAddress.txPublicKey.toGroup().scale(PrivateKey.fromBase58(subjectKeyPairs.v).s)

    // Derive the one-time key and check if it matches the destination address of the transaction.
    const K = Group.generator.scale(Poseidon.hash(F.toFields()).toBigInt()).add(PublicKey.fromBase58(subjectKeyPairs.S).toGroup());

    expect(proof.publicInput.subjectStealthAddress.oneTimeAddress).toEqual(PublicKey.fromGroup(K))
    
  })
  it('A wallet can load the kycProof its been issued and increments the depositTotal value of the zkcontract', async () => {
    
    // Issue the credential/proof
      // subject creates their view and spend key pairs
      const subjectKeyPairs = deriveKeyPairs(subjectPrvKey.toBase58())

      // issuer creates stealth address for the subject
      const subjectStealthAddress = new StealthAddress(PublicKey.fromBase58(subjectKeyPairs.S), PublicKey.fromBase58(subjectKeyPairs.V));
      // issuer creates public inputs
      const publicInputs = new ZkKycClaimInputs(issuerPubKey, subjectStealthAddress, Bool(true), Signature.create(issuerPrvKey, Bool(true).toFields()))
      // compile the ZkProgram
      await ZkKycClaimProgram.compile()
      // Create credential proof property
      const p = await ZkKycClaimProgram.createZkKycClaimProof(publicInputs)
      const ZkKYCproof = p as ZkKycProof;
    /**
     * We assume that the proof has already been issued to the
     * subject. And that the subject can load the credentials, 
     * and provide the `proof` field of the object to the zkApp.
     * 
     * e.g. provider.request({method: "requestObject", params: {issuer: "B62...ds", uuid: ...}}): Promise<object>
     */
    expect(ZkKYCproof).toBeDefined();

    // Define amount to deposit
    const amount = Field(100);

    // Deploy the zkApp
    await localDeploy();

    // get inital deposit value
    const initialDepositValue = await zkApp.depositTotal.get();

    // construct contract.deposit() arguments)
    const R = ZkKYCproof.publicInput.subjectStealthAddress.txPublicKey
    const H_F = Scalar.from(Poseidon.hash((R.toGroup().scale(PrivateKey.fromBase58(subjectKeyPairs.v).s)).toFields()).toBigInt())
    // construct transaction
    const postProofTxn = await Mina.transaction(subjectPubKey, () => {
      zkApp.deposit(ZkKYCproof, H_F, amount);
    })
    await postProofTxn.prove();
    /* 
     * e.g. provider.request({method: "signTransaction", params: transaction}}): Promise<signedTransaction>
     */
    await postProofTxn.sign([subjectPrvKey]).send();
    console.log("new state", await zkApp.depositTotal.get());
    expect(await zkApp.depositTotal.get()).toEqual(initialDepositValue.add(amount));
  });

});