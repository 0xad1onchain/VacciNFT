import React, { Component } from "react";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import Web3 from "web3";
import config from "./config.json";
import "./App.css";
import Color from "../abis/Color.json";
import homeBanner from "./img/homebanner@2x.png";
import covacContract from "./img/covacContract@2x.png";
import aditya from "./img/aditya@2x.png";
import anurag from "./img/anurag@2x.png";
import hemant from "./img/hemant@2x.png";

const Portis = require("@portis/web3");

const IPFS = require("ipfs-api");
const ipfs = new IPFS({
  host: "ipfs.infura.io",
  port: 5001,
  protocol: "https",
});

class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      account: "",
      contact: "",
      totalSupply: undefined,
      colors: [],
      address: "",
    };
  }

  async componentWillMount() {
    // await this.loadWeb3();
    await this.loadBlockchainData();
  }

  // async loadWeb3() {
  //   if (window.ethereum) {
  //     window.web3 = new Web3(window.ethereum);
  //     await window.ethereum.enable();
  //   } else if (window.web3) {
  //     window.web3 = new Web3(window.web3.currentProvider);
  //   } else {
  //     window.alert(
  //       "Non-Ethereum browser detected. You should consider trying MetaMask!"
  //     );
  //   }
  // }

  async loadBlockchainData() {
    const portis = new Portis(config.dappId, config.network);
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
      this.setState({ contract, address });
      const totalSupply = await contract.methods.totalSupply().call();
      this.setState({ totalSupply });
      // Load Colors
      console.log(contract.methods);
      const colors = await contract.methods.uriList(0).call();
      console.log(colors);
      // for (var i = 0; i < colors.length; i++) {
      //   const metadataBytes = await ipfs.cat(colors[i]);
      //   var metadataStr = new TextDecoder().decode(metadataBytes);
      //   const metadata = JSON.parse(metadataStr);
      //   this.setState({
      //     colors: [...this.state.colors, metadata],
      //   });
      // }
      for (var i = 1; i <= totalSupply; i++) {
        const color = await contract.methods.uriList(i - 1).call();

        const metadataBytes = await ipfs.cat(color);
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

  render() {
    return (
      <div>
        <div className="container-fluid mt-5 ">
          <div className="row home-banner-wrapper">
            <div class="col-md-7 mb-7 banner-left">
              <img src={homeBanner}></img>
            </div>
            <div class="col-md-5 mb-5 banner-right">
              <h2 className="title"> Built for everyone.</h2>
              <p className="para-content">
                Covac is a simple platform build for a regular person to easily
                mint their own NFT tokens after they get their vaccine shots.
              </p>
              {/* <a href="#" className="button-primary"> */}
              <Link to="/tokens" className="button-primary">
                <span>Claim my tokens now</span>
              </Link>
              {/* </a> */}
            </div>
          </div>
          <div className="row made-with-love row made-with-love-v2">
            <h3 className="sub-title">Made With Love For India</h3>
            <h2 className="title primary-title latest-token-claimed">
              {" "}
              Latest Tokens Claimed{" "}
            </h2>
          </div>
          <div className="row text-center in-grid-375">
            {this.state.colors.map((color, key) => {
              return (
                <div key={key} className="col-md-4 mb-4 nft-tokens-home">
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
          <div className="center-button see-all">
            <a
              href={`${config.deployedNetworkScanner}${this.state.address}`}
              className="button-primary"
            >
              <span>See All!</span>
            </a>
          </div>
          <div className="row dark-back in-grid-375">
            <div class="col-md-6 mb-6 what-is-covac">
              <h3 className="sub-title white-substitle">What is Covac?</h3>
              <h2 className="title secondary-title"> A One-Step Process</h2>
              <p className="para-content para-content-white">
                Covac wants every person in this world to become of part of
                history and celebrate the win of humanity against the deadly
                covid-19 virus.
              </p>
              <p className="para-content para-content-white">
                Covac lets any person mint their own personalised non-fungible
                token (NFT) in one simple step if they have got their vaccine
                shot!
              </p>
              {/* <a href="#" className="button-secondary-outline"> */}
              <Link to="/tokens" className="button-secondary-outline">
                <span>Claim my tokens</span>
              </Link>
              {/* </a> */}
            </div>
            <div class="col-md-6 mb-6 what-is-covac">
              <img src={covacContract}></img>
            </div>
          </div>

          <div className="row made-with-love">
            <h2 className="title primary-title meet-the-team">
              {" "}
              Meet The Team
            </h2>
          </div>
          <div className="team-wrapper">
            <div className="row in-grid-550">
              <div class="col-md-4 mb-4 team-image">
                <img src={aditya}></img>
              </div>
              <div class="col-md-8 mb-8 teammate-content">
                <h6 className="teammate-name">Aditya Gupta</h6>
                <p className="para-content">
                  Aditya is a solidity and web3.js developer who is passionate
                  about decentralization technologies and their real world use
                  cases. In his free time, he learns about finance and follows
                  F1.
                </p>
                {/* <a href="#" className="button-primary">
                <span>
                  Claim my tokens now
                  </span>
              </a> */}
              </div>
            </div>
            <div className="row in-grid-550">
              <div class="col-md-4 mb-4 team-image">
                <img src={anurag}></img>
              </div>
              <div class="col-md-8 mb-8 teammate-content">
                <h6 className="teammate-name">Anurag Hakeem</h6>
                <p className="para-content">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </p>
                {/* <a href="#" className="button-primary">
                <span>
                  Claim my tokens now
                  </span>
              </a> */}
              </div>
            </div>
            <div className="row in-grid-550">
              <div class="col-md-4 mb-4 team-image">
                <img src={hemant}></img>
              </div>
              <div class="col-md-8 mb-8 teammate-content">
                <h6 className="teammate-name">Hemant</h6>
                <p className="para-content">
                  Backend Developer with interests in Blockchain and Linux. I
                  love the concept of self-hosting and am on the lookout for new
                  services to self-host. New tech is big YES. Currently working
                  as SDE at McAfee.
                </p>
                {/* <a href="#" className="button-primary">
                <span>
                  Claim my tokens now
                  </span>
              </a> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Home;
