import React, { Component, Fragment } from "react";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import Web3 from "web3";

class Navbar extends Component {
  constructor(props) {
    super(props);
    console.log(props);
    this.state = {
      account: "",
    };
  }

  async componentWillMount() {
    await this.loadWeb3();
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
      const web3 = window.web3;
      const accounts = await web3.eth.getAccounts();
      this.setState({ account: accounts[0] });
      console.log(accounts[0]);
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
      const web3 = window.web3;
      const accounts = await web3.eth.getAccounts();
      this.setState({ account: accounts[0] });
      console.log(accounts[0]);
    } else {
      window.alert(
        "Non-Ethereum browser detected. You should consider trying MetaMask!"
      );
    }
  }

  render() {
    return (
      <Fragment>
        <nav className="navbar navbar-dark flex-md-nowrap p-0">
          {/* <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow"> */}
          <a
            className="navbar-brand col-sm-3 col-md-2 mr-0"
            href="https://github.com/adigupta13/vaccinft"
            target="_blank"
            rel="noopener noreferrer"
          >
            COVAC
          </a>
          <ul className="navbar-nav px-3">
            <li className="nav-item text-nowrap d-none d-sm-none d-sm-block">
              {/* <a href="#">Home</a> */}

              <Link to="/">
                <span>Home</span>
              </Link>
            </li>
            <li className="nav-item text-nowrap d-none d-sm-none d-sm-block">
              {/* <a href="#">My Tokens</a> */}

              <Link to="/tokens">
                <span>My Tokens</span>
              </Link>
            </li>
            <li className="nav-item text-nowrap d-none d-sm-none d-sm-block">
              <span id="account">{this.state.account}</span>
            </li>
          </ul>
        </nav>
      </Fragment>
    );
  }
}

export default Navbar;