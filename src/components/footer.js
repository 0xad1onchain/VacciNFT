import React from 'react';
import {Fragment} from 'react';

var Footer = () => {
    return(
        <Fragment>
        <div className="footer-wrapper in-grid-375">
            <h2 className="title white-title">Share your feedback at</h2>
            <div className="email-white"><a href="mailto:covac@gmail.com">covac@gmail.com</a></div>
        </div>
        <div className="lower-footer-wrapper">
        <p className="para-content para-content-white">All Rights Reserved. ©Covac 2021.</p>
        </div>
        </Fragment>
    );
}

export default Footer;