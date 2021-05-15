import React, { Component } from "react";
import Web3 from "web3";
import "./App.css";
import getSVG from "../utils/svg";
import Color from "../abis/Color.json";
import PDFJS from "pdfjs-dist/build/pdf";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";
import JSZip from "jszip";
import { scanImageData } from "zbar.wasm";
import config from "../config.json";
import { CertificateDetailsPaths } from "../constants";

// import Footer from './footer'
// import homeBanner from './img/homebanner@2x.png'
// import covacContract from './img/covacContract@2x.png'
// import aditya from './img/aditya@2x.png'
// import anurag from './img/anurag@2x.png'
// import hemant from './img/hemant@2x.png'

export const CERTIFICATE_FILE = "certificate.json";

const jsigs = require("jsonld-signatures");
const { RSAKeyPair } = require("crypto-ld");
const { documentLoaders } = require("jsonld");
const { node: documentLoader } = documentLoaders;
const { contexts } = require("security-context");
const credentialsv1 = require("../utils/credentials.json");
const { vaccinationContext } = require("vaccination-context");

const IPFS = require("ipfs-api");
const ipfs = new IPFS({
  host: "ipfs.infura.io",
  port: 5001,
  protocol: "https",
});

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      account: "",
      contract: null,
      totalSupply: 0,
      colors: [],
      selectedFile: null,
      qr_image: null,
      verified: true,
      name: undefined,
      dose: undefined,
      certificateId: undefined,
    };
  }

  async componentWillMount() {
    await this.loadWeb3();
    await this.loadBlockchainData();
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert(
        "Non-Ethereum browser detected. You should consider trying MetaMask!"
      );
    }
  }

  async loadBlockchainData() {
    const web3 = window.web3;
    // Load account
    const accounts = await web3.eth.getAccounts();
    this.setState({ account: accounts[0] });

    const networkId = await web3.eth.net.getId();
    const networkData = Color.networks[networkId];
    if (networkData) {
      const abi = Color.abi;
      const address = networkData.address;
      const contract = new web3.eth.Contract(abi, address);
      this.setState({ contract });
      const totalSupply = await contract.methods.totalSupply().call();
      this.setState({ totalSupply });
      // Load Colors
      const user = await contract.methods.users(this.state.account).call();
      console.log(user);
      this.setState({
        dose1: user.dose1hash,
        dose2: user.dose2hash,
      });
    } else {
      window.alert("Smart contract not deployed to detected network.");
    }
  }

  mint = async () => {
    console.log(this.state);
    if (this.state.verified !== true || this.state.certificateId === undefined)
      return;
    const file = getSVG(this.state.name, this.state.dose);
    console.log(file);
    const fileBuffer = Buffer.from(file, "utf8");
    await ipfs.add(fileBuffer, async (err, imageHash) => {
      console.log(imageHash);
      console.log(await ipfs.cat(imageHash[0].hash));

      const metadata = {
        title: "Vaccine Shot",
        type: "object",
        properties: {
          name: {
            type: "string",
            description: `Proof of Vaccination for ${this.state.name}`,
          },
          description: {
            type: "string",
            description: `My #${this.state.dose} shot of COVID-19 Vaccine`,
          },
          image: {
            type: "string",
            description: `https://ipfs.infura.io/ipfs/${imageHash[0].hash}`,
          },
        },
      };
      console.log(metadata);
      const metDataStr = JSON.stringify(metadata);
      const metaDataBuffer = Buffer.from(metDataStr, "utf8");

      await ipfs.add(metaDataBuffer, async (err, metaHash) => {
        console.log(metaHash[0].hash);
        console.log(await ipfs.cat(metaHash[0].hash));

        this.state.contract.methods
          .mint(
            metaHash[0].hash,
            "" + this.state.dose,
            this.state.certificateId
          )
          .send({ from: this.state.account })
          .once("receipt", (receipt) => {
            this.setState({
              colors: [...this.state.colors, metadata],
            });
          });
      });
    });
  };

  onFileChange = (event) => {
    // Update the state
    this.setState({ selectedFile: event.target.files[0] });
  };

  onFileUpload = async () => {
    try {
      const fileData = await this.toBase64(this.state.selectedFile);
      const fileBinary = this.convertDataURIToBinary(fileData);

      console.log(fileBinary);
      const doc = await PDFJS.getDocument({ data: fileBinary });
      const page = await doc.getPage(1);

      var scale = 1.5;
      var viewport = page.getViewport(scale);

      var canvas = document.getElementById("the-canvas");
      var context = canvas.getContext("2d");
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport: viewport });

      // var img = canvas.toDataURL("image/png");
      // this.setState({qr_image: img});
      // console.log(img);

      var imageData = context.getImageData(530, 875, 340, 340);
      canvas.hidden = true;
      console.log(imageData);
      var canvas1 = document.getElementById("cropped-qr");
      canvas1.width = 340;
      canvas1.height = 340;
      var ctx1 = canvas1.getContext("2d");
      ctx1.rect(0, 0, 340, 340);
      ctx1.fillStyle = "white";
      ctx1.fill();
      ctx1.putImageData(imageData, 0, 0);

      var img = canvas1.toDataURL("image/png");

      let data = ctx1.getImageData(0, 0, canvas1.width, canvas1.height);
      canvas1.hidden = true;
      const symbols = await scanImageData(data);
      console.log(symbols, Date.now());

      const zippedData = symbols[0].decode();
      const zip = new JSZip();
      const unzippedData = await zip.loadAsync(zippedData);

      console.log(unzippedData);
      const certificateData = await unzippedData.files[CERTIFICATE_FILE].async(
        "text"
      );

      console.log(JSON.parse(certificateData));

      const signedJSON = JSON.parse(certificateData);
      const signedJSONCopy = signedJSON;
      console.log("certificateData", signedJSON);
      const publicKey = {
        "@context": jsigs.SECURITY_CONTEXT_URL,
        id: "did:india",
        type: "RsaVerificationKey2018",
        controller: "https://cowin.gov.in/",
        publicKeyPem: config.certificatePublicKey,
      };
      const controller = {
        "@context": jsigs.SECURITY_CONTEXT_URL,
        id: "https://cowin.gov.in/",
        publicKey: [publicKey],
        // this authorizes this key to be used for making assertions
        assertionMethod: [publicKey.id],
      };

      console.log("controller", controller);
      const key = new RSAKeyPair({ ...publicKey });
      const { AssertionProofPurpose } = jsigs.purposes;
      const { RsaSignature2018 } = jsigs.suites;
      const result = await jsigs.verify(signedJSON, {
        suite: new RsaSignature2018({ key }),
        purpose: new AssertionProofPurpose({ controller }),
        documentLoader: this.customLoader,
        compactProof: false,
      });
      console.log(signedJSON.evidence);

      if (result.verified) {
        this.setState({
          name: signedJSONCopy.credentialSubject.name,
          dose: signedJSONCopy.evidence[0].dose,
          verified: true,
          certificateId: signedJSONCopy.evidence[0].certificateId,
        });
      }
    } catch (e) {
      console.log(e);
    }
  };

  toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  bin2String(array) {
    var result = "";
    for (var i = 0; i < array.length; i++) {
      result += String.fromCharCode(parseInt(array[i], 2));
    }
    return result;
  }

  convertDataURIToBinary(dataURI) {
    const BASE64_MARKER = ";base64,";
    var base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
    var base64 = dataURI.substring(base64Index);
    var raw = window.atob(base64);
    var rawLength = raw.length;
    var array = new Uint8Array(new ArrayBuffer(rawLength));

    for (var i = 0; i < rawLength; i++) {
      array[i] = raw.charCodeAt(i);
    }
    return array;
  }

  customLoader = (url) => {
    console.log("checking " + url);
    const c = {
      "did:india": config.certificatePublicKey,
      "https://example.com/i/india": config.certificatePublicKey,
      "https://w3id.org/security/v1": contexts.get(
        "https://w3id.org/security/v1"
      ),
      "https://www.w3.org/2018/credentials#": credentialsv1,
      "https://www.w3.org/2018/credentials/v1": credentialsv1,
      "https://cowin.gov.in/credentials/vaccination/v1": vaccinationContext,
    };
    let context = c[url];
    if (context === undefined) {
      context = contexts[url];
    }
    if (context !== undefined) {
      return {
        contextUrl: null,
        documentUrl: url,
        document: context,
      };
    }
    if (url.startsWith("{")) {
      return JSON.parse(url);
    }
    console.log("Fallback url lookup for document :" + url);
    return documentLoader()(url);
  };

  render() {
    return (
      <div>
        <div className="container-fluid mt-5 ">
          {/* old */}
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mr-auto ml-auto">
                <h1>Issue Token</h1>
                <button
                  onClick={this.mint}
                  className="btn btn-block btn-primary"
                  disabled={!this.state.verified}
                >
                  Mint
                </button>

                <div>
                  <input type="file" onChange={this.onFileChange} />
                  <button onClick={this.onFileUpload}>Upload!</button>

                  <canvas id="cropped-qr"></canvas>
                  <img src={this.state.qr_image} />
                </div>
              </div>
            </main>
          </div>
          <hr />
        </div>
        <canvas display="none" id="the-canvas"></canvas>
      </div>
    );
  }
}

export default App;
