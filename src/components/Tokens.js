import React, { Component } from "react";
import { Fragment } from "react";
import MyTokens from "./MyTokens";
import Footer from "./footer";
import Navbar from "./navbar";

class Tokens extends Component {
  render() {
    return (
      <Fragment>
        <MyTokens />
      </Fragment>
    );
  }
}

export default Tokens;
