import { Field, SmartContract, state, State, method} from 'snarkyjs';
import { AttestationProof } from '@herald-sdk/provable-programs';
/**
 * Basic Example for a counter zkApp with recursion
 * See https://docs.minaprotocol.com/zkapps for more info.
 */

export class KYCDepositCompliantContract extends SmartContract {

 // on-chain version of our state. This will typically lag
 // behind the version that's implicitly represented by the list of actions
 @state(Field) depositTotal = State<Field>();

 // initialize the value to 0
 init() {
    super.init();
    this.depositTotal.set(Field(0));
  }

 @method deposit(proof: AttestationProof, amount: Field) {
    // 1. assert the current counter value
    this.depositTotal.getAndAssertEquals();
    // 2. verify proof
    proof.verify();
    // 3. create new state
    const newState = this.depositTotal.get().add(amount);;
    // 4. update counter
    this.depositTotal.set(newState);
 }
}
