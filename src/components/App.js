import React, { Component, Fragment } from "react";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import Home from "./home";
import Tokens from "./Tokens";
import Footer from "./footer";
import Navbar from "./navbar";

class App extends Component {
  render() {
    return (
      <Fragment>
        <Router>
          <div>
            <Switch>
              <Route path="/tokens">
                <Navbar />
                <Tokens />
                <Footer />
              </Route>
              <Route path="/">
                <Navbar />
                <Home />
                <Footer />
              </Route>
            </Switch>
          </div>
        </Router>
      </Fragment>
    );
  }
}

export default App;
