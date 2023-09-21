import { Field, SmartContract, state, State, method, verify, VerificationKey} from 'snarkyjs';
import { KycProof } from '@herald-sdk/provable-programs';
/**
 * Basic Example for a counter zkApp with recursion
 * See https://docs.minaprotocol.com/zkapps for more info.
 */

export class KYCDepositCompliantContract extends SmartContract {

 // on-chain version of our state. This will typically lag
 // behind the version that's implicitly represented by the list of actions
 @state(Field) depositTotal = State<Field>();

 // initialize the value to 0
 override init() {
    super.init();
    this.depositTotal.set(Field(0));
  }

 @method deposit(proof: KycProof, amount: Field) {
    // 1. assert the current counter value
    this.depositTotal.getAndAssertEquals();
    // 2. verify proof
    proof.verify();
    // 3. verify proof's public output contains the depositor's info
    /* verify sender is PoI in proof */
    const proofSubject = proof.publicInput.subjectPubKey
    this.sender.assertEquals(proofSubject)
    // 4. create new state
    const newState = this.depositTotal.get().add(amount);
    // 5. update counter
    this.depositTotal.set(newState);
 }
}
