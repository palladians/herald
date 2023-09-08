import { Field, SmartContract, state, State, method, PublicKey, Group, Scalar} from 'snarkyjs';
import { ZkKycProof } from '@herald-sdk/provable-programs';
/**
 * Basic Example for a counter zkApp with recursion
 * See https://docs.minaprotocol.com/zkapps for more info.cd
 */

export class ZkKYCDepositCompliantContract extends SmartContract {

 // on-chain version of our state. This will typically lag
 // behind the version that's implicitly represented by the list of actions
 @state(Field) depositTotal = State<Field>();

 // initialize the value to 0
 override init() {
    super.init();
    this.depositTotal.set(Field(0));
  }
/**
 * 
 * @param proof zkKycProof type
 * @param H_F Scalar of the ephemeral key
 * @param v subject's private viewing key
 * @param amount amount
 */
 @method deposit(proof: ZkKycProof, H_F: Scalar, amount: Field) {
    // 1. assert the current counter value
    this.depositTotal.getAndAssertEquals();
    // 2. verify proof
    proof.verify();
    // 3. verify proof's public output contains the depositor's info
    /* verify sender is PoI in proof */
    // Derive the one-time key and check if it matches the destination address of the transaction.
    const K = Group.generator.scale(H_F).add(this.sender.toGroup());
   // assert the sender is the expected subject
    proof.publicInput.subjectStealthAddress.oneTimeAddress.assertEquals(PublicKey.fromGroup(K))
    // 4. create new state
    const newState = this.depositTotal.get().add(amount);
    // 5. update counter
    this.depositTotal.set(newState);
 }
}
