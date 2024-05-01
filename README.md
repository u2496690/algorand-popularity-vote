
# Algorand popularity Vote Tutorial

The present tutorial is designed to cater to the needs of programmers with varying degrees of proficiency, who aspire to engage in web3 development or Algorand chain development. A basic comprehension of javascript, python, and smart contracts would suffice as a prerequisite to engage with the content. The tutorial is structured in a manner that facilitates progressive learning, with the aim of enabling the participant to attain a comprehensive understanding of the Algorand development pipeline and successfully create a functional dapp.



## Usage

- Install the dependencies.
```bash
cd algorand-backend
npm install
```

- Create the python virtual environment and install the dependencies.
```bash
python3 -m venv venv
. venv/bin/activate
pip install -r requirements.txt
```

- Run the first file to create an account.
```bash
node scripts/1-create-account.js
```
Make sure you saved the account data and open in in a wallet created on [Pera Wallet](https://web.perawallet.app/)

- Run the popularityvote script in python to create the artifacts

```bash
python3 contracts/popularityvote.py
```

- Deploy the smart contracts
Make sure you changed the mnemonic in:
```javascript
let myaccount = algosdk.mnemonicToSecretKey("your mnemonic");
```
Then run the script.
```bash
node scripts/5-deploy-popularityvote.js
```

- Start the front-end
```bash
cd ..
cd popularityvote
```

Make sure you update the app id with the one from the terminal earlier
```javascript
  // CHANGE THIS TO YOUR APP ID
  const app_address = YOUR APP ID;
  // CHANGE THIS TO YOUR APP ID
```
When the code is prepared, install the dependencies:
```bash
npm install
```

Then start the dev server:
```bash
npm run dev
```






## Acknowledgements

 - [Antony Silvetti-Schmitt for the origial tutorial](https://github.com/Antony-SS?tab=repositories)
 - [Vite Templates](https://vitejs.dev/)
