import React, { Component } from "react";
import Web3 from "web3";
import "./App.css";
import getSVG from "../utils/svg";
import Color from "../abis/Color.json";
import PDFJS from "pdfjs-dist/build/pdf";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";
import JSZip from "jszip";
import { scanImageData } from "zbar.wasm";
import config from "./config.json";
import { CertificateDetailsPaths } from "../constants";
import {
  FacebookShareButton,
} from "react-share";

// import Footer from './footer'
// import homeBanner from './img/homebanner@2x.png'
// import covacContract from './img/covacContract@2x.png'
// import aditya from './img/aditya@2x.png'
// import anurag from './img/anurag@2x.png'
import banner from "./img/about-banner@2x.png";

const Portis = require("@portis/web3");

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
      verified: false,
      name: "",
      dose: "",
      certificateId: "",
      dose1: "",
      dose2: "",
      colors: [],
    };
  }

  async componentWillMount() {
    // await this.loadWeb3();
    await this.loadBlockchainData();
  }

  async loadBlockchainData() {
    const portis = new Portis(config.dappId, config.network, {
      gasRelay: true,
    });
    const web3 = new Web3(portis.provider);
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
      this.setState({colors:[]})
      if (this.state.dose1 !== "") {
        const metadataBytes = await ipfs.cat(this.state.dose1);
        var metadataStr = new TextDecoder().decode(metadataBytes);
        const metadata = JSON.parse(metadataStr);
        console.log(metadata);
        this.setState({
          colors: [...this.state.colors, metadata],
        });
      }

      if (this.state.dose2 !== "") {
        const metadataBytes = await ipfs.cat(this.state.dose2);
        var metadataStr = new TextDecoder().decode(metadataBytes);
        const metadata = JSON.parse(metadataStr);
        console.log(metadata);
        this.setState({
          colors: [...this.state.colors, metadata],
        });
      }
    } else {
      window.alert("Smart contract not deployed to detected network.");
    }
  }

  mint = async () => {
    console.log(this.state);
    if (this.state.verified !== true || this.state.certificateId === "") return;
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
    await this.loadBlockchainData();
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
          <div className="row made-with-love row got-covid-shot col-lg-12">
            <h3 className="sub-title">Got Your Covid-19 Shot?</h3>
            <h2 className="title primary-title latest-token-claimed">
              Claim The World’s First Certificate-Based NFT
            </h2>
          </div>
          <div className="row col-lg-12">
            <img src={banner} className="about-hero-img"></img>
          </div>
          <div className="row col-lg-12 about-para">
            <p className="para-content">
              Non fungible token celebrate the power of eternity and present us
              with a way to digitally store our most beloved priceless
              possessions. An NFT is a digital asset that represents real-world
              objects like art, music, in-game items and videos. They are bought
              and sold online, frequently with cryptocurrency, and they are
              generally encoded with the same underlying software as many
              cryptos.
            </p>
            <p className="para-content">
              The COVID-19 pandemic has led to a dramatic loss of human life
              worldwide and presented an unprecedented challenge to public
              health, food systems and the world of work. The economic and
              social disruption caused by the pandemic has been devastating:
              tens of millions of people are at risk of falling into extreme
              poverty. Despite all the challenges the pandemic has presented,
              many scientific groups have come out with vaccines that will help
              restore normalcy in our lives.
            </p>
            <p className="para-content">
              Covac celebrates the brave fight humanity has put against this
              deadly virus and wants to store it for eternity. We want to thank
              every single person who has done their bit by helping as a
              frontline-worker, donating or staying at home to avoid the spread
              of virus and present them with these awesome NFT tokens which they
              can mint by uploading their pdf certificate of their vaccine shot.
            </p>
          </div>
          <div className="row col-lg-12 made-with-love">
            {(this.state.dose1 !== "" && this.state.dose2 === "") ||
            (this.state.dose1 === "" && this.state.dose2 !== "") ? (
              <h2 className="title looks-like-no-vaccine center-aligned">
                {`Looks like you have claimed 1 tokens so far :)`}
              </h2>
            ) : this.state.dose1 !== "" && this.state.dose2 !== "" ? (
              <h2 className="title looks-like-no-vaccine center-aligned">
                {`Wow you have claimed both your tokens :)`}
              </h2>
            ) : (
              <h2 className="title looks-like-no-vaccine center-aligned">
                {`Looks like you have not claimed any tokens yet :(`}
              </h2>
            )}
            <h3 className="sub-title register-content center-aligned">
              Regester for your vaccine shot on{" "}
              <a href="https://www.cowin.gov.in/home">
                https://www.cowin.gov.in
              </a>
            </h3>

            {this.state.dose1 === "" || this.state.dose2 === "" ? (
              <div>
                <h3 className="sub-title center-aligned">Got your vaccine shot?</h3>
                <h2 className="title center-aligned">Claim your tokens in 1 simple step!</h2>
              </div>
            ) : (
              <div>
                <h3 className="sub-title center-aligned">
                  Great Job getting vaccinated and helping us fight COVID
                </h3>
                <h2 className="title center-aligned">Your Claimed Tokens:</h2>
              </div>
            )}
          </div>
          <div className="row text-center in-grid-375">
            {this.state.colors.map((color, key) => {
              return (
                <div key={key} className="col-md-6 mb-6 nft-tokens-home nft-tokens-about">
                  {/* <div className="token" style={{ backgroundColor: color }}></div> */}
                  <div>
                    <img
                      src={`${color.properties.image.description}`}
                      alt="NFT here"
                      href={`${config.deployedNetworkScanner}${this.state.address}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {this.state.dose1 === "" || this.state.dose2 === "" ? (
            <div>
              <div className="row col-lg-12 choose-file-button">
                {/* <input type="file" onChange={this.onFileChange} /> */}
                <input
                  type="file"
                  name="file"
                  id="file"
                  class="inputfile"
                  onChange={this.onFileChange}
                />
                <label for="file">Choose a file</label>
              </div>
              <div className="row col-lg-12 about-buttons">
                <button onClick={this.onFileUpload} class="upload-button">
                  Upload!
                </button>
              </div>
              <div className="row col-lg-12 about-buttons">
                <button
                  onClick={this.mint}
                  className="btn btn-block btn-primary"
                  disabled={!this.state.verified}
                  // disabled={true}
                  className="mint-button"
                >
                  Mint
                </button>
              </div>
            </div>
          ) : (
            <></>
          )}
          {/* <div className="row col-lg-12">
            <FacebookShareButton url={this.state.colors[0]} quote="I just minted my first vaccine NFT tokens! Get yours today at https://vaccinft.vercel.app/"/>
          </div> */}
          <div className="row col-lg-12">
            <canvas id="cropped-qr"></canvas>
            <img src={this.state.qr_image} />
            <img src={this.state.qr_image} />
            <canvas display="none" id="the-canvas"></canvas>
          </div>
          {/* old */}
          {/* <div className="row">
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
        <canvas display="none" id="the-canvas"></canvas> */}
        </div>
      </div>
    );
  }
}

export default App;
