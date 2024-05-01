import dotenv from "dotenv";
import algosdk from "algosdk";
import { open, readFile } from "node:fs/promises";
dotenv.config();
const baseServer = "https://testnet-api.algonode.cloud";
const algodClient = new algosdk.Algodv2('', baseServer, '');
let myaccount = algosdk.mnemonicToSecretKey("post reason test weather hamster remind skin candy stand congress mandate mushroom flower identify boil spin embark donate stamp orbit knock civil casino ability siege");
let sender = myaccount.addr;
async function compileProgram(client, TealSource) {
    let encoder = new TextEncoder();
    let programBytes = encoder.encode(TealSource);
    let compileResponse = await client.compile(programBytes).do();
    let compiledBytes = new Uint8Array(
        Buffer.from(compileResponse.result, "base64")
    );
    return compiledBytes;
}
(async () => {
try {
    const localInts = 0;
    const localBytes = 0;
    const globalInts = 2;
    const globalBytes = 0;
    const approvalProgramfile = await open(
        "./contracts/artifacts/popularityvote_approval.teal"
    );
    const clearProgramfile = await open(
        "./contracts/artifacts/popularityvote_clear.teal"
    );
    const approvalProgram = await approvalProgramfile.readFile();
    const clearProgram = await clearProgramfile.readFile();
    const approvalProgramBinary = await compileProgram(
        algodClient,
        approvalProgram
    );
    const clearProgramBinary = await compileProgram(algodClient, clearProgram);
    let params = await algodClient.getTransactionParams().do();
    const onComplete = algosdk.OnApplicationComplete.NoOpOC;
    console.log("Deploying Application. . . . ");
    let txn = algosdk.makeApplicationCreateTxn(
        sender,
        params,
        onComplete,
        approvalProgramBinary,
        clearProgramBinary,
        localInts,
        localBytes,
        globalInts,
        globalBytes
    );
    let txId = txn.txID().toString();
    // Sign the transaction
    let signedTxn = txn.signTxn(myaccount.sk);
    console.log("Signed transaction with txID: %s", txId);
    // Submit the transaction
    await algodClient.sendRawTransaction(signedTxn).do();
    // Wait for confirmation
    await algosdk.waitForConfirmation(algodClient, txId, 2);
    // print the app-id
    let transactionResponse = await algodClient
        .pendingTransactionInformation(txId)
        .do();
    let appId = transactionResponse["application-index"];
    console.log("Created new with app-id: ", appId);
 } catch (err) {
    console.error("Failed to deploy!", err);
    process.exit(1);
 }
})();