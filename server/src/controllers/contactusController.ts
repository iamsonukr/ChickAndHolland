import {Request, Response, Router} from "express";
import asyncHandler from "../middleware/AsyncHandler";
import {mail} from "../lib/Utils";
import Contactus from "../models/contactus";

// import { dbDelete } from "../middleware/Validator";
// import { idValidater } from "../lib/Validations";
// import { TABLE_NAMES } from "../constants";
// import { created, deleted } from "../lib/Responses";
// import Contactus from "../models/contactus";
const router = Router();

const RES_NAME = "Contactus";

router.post(
    "/",
    // validate(constactUsFormValidator),
    asyncHandler(async (req: Request, res: Response) => {
        const {name, email, phoneNumber, subject, message, state, country} = req.body;
          
        await Contactus.create({
            name,
            email,
            phoneNumber,
            subject,
            message,
            state,
            country,
        }).save();

        mail({
            html: `<!DOCTYPE html>
      <html
        lang="en"
        xmlns="http://www.w3.org/1999/xhtml"
        xmlns:v="urn:schemas-microsoft-com:vml"
        xmlns:o="urn:schemas-microsoft-com:office:office"
      >
        <head>
          <title>New Enquiry - ChicandBlood</title>
          <!--[if !mso]><!-- -->
          <meta http-equiv="X-UA-Compatible" content="IE=edge" />
          <!--<![endif]-->
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style type="text/css">
            #outlook a {
              padding: 0;
            }
      
            body {
              margin: 0;
              padding: 0;
              -webkit-text-size-adjust: 100%;
              -ms-text-size-adjust: 100%;
            }
      
            table,
            td {
              border-collapse: collapse;
              mso-table-lspace: 0pt;
              mso-table-rspace: 0pt;
            }
      
            img {
              border: 0;
              height: auto;
              line-height: 100%;
              outline: none;
              text-decoration: none;
              -ms-interpolation-mode: bicubic;
            }
      
            p {
              display: block;
              margin: 13px 0;
            }
          </style>
          <!--[if mso]>
            <xml>
              <o:OfficeDocumentSettings>
                <o:AllowPNG />
                <o:PixelsPerInch>96</o:PixelsPerInch>
              </o:OfficeDocumentSettings>
            </xml>
          <![endif]-->
          <!--[if lte mso 11]>
            <style type="text/css">
              .mj-outlook-group-fix {
                width: 100% !important;
              }
            </style>
          <![endif]-->
          <!--[if !mso]><!-->
          <link
            href="https://fonts.googleapis.com/css?family=Roboto:100,300,400,700"
            rel="stylesheet"
            type="text/css"
          />
          <style type="text/css">
            @import url(https://fonts.googleapis.com/css?family=Roboto:100,300,400,700);
          </style>
          <!--<![endif]-->
          <style type="text/css">
            @media only screen and (min-width: 480px) {
              .mj-column-per-100 {
                width: 100% !important;
                max-width: 100%;
              }
            }
          </style>
          <style type="text/css">
            @media only screen and (max-width: 480px) {
              table.mj-full-width-mobile {
                width: 100% !important;
              }
      
              td.mj-full-width-mobile {
                width: auto !important;
              }
            }
          </style>
          <style type="text/css">
            a,
            span,
            td,
            th {
              -webkit-font-smoothing: antialiased !important;
              -moz-osx-font-smoothing: grayscale !important;
            }
          </style>
        </head>
      
        <body style="background-color: #54595f">
          <div
            style="
              display: none;
              font-size: 1px;
              color: #ffffff;
              line-height: 1px;
              max-height: 0px;
              max-width: 0px;
              opacity: 0;
              overflow: hidden;
            "
          >
            Preview - New Enquiry - ChicandBlood
          </div>
          <div style="background-color: #54595f">
            <!--[if mso | IE]>
                      <table
                         align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600"
                      >
                        <tr>
                          <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
                      <![endif]-->
            <div style="margin: 0px auto; max-width: 600px">
              <table
                align="center"
                border="0"
                cellpadding="0"
                cellspacing="0"
                role="presentation"
                style="width: 100%"
              >
                <tbody>
                  <tr>
                    <td
                      style="
                        direction: ltr;
                        font-size: 0px;
                        padding: 20px 0;
                        text-align: center;
                      "
                    >
                      <!--[if mso | IE]>
                                  <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                
                        <tr>
                      
                            <td
                               class="" style="vertical-align:top;width:600px;"
                            >
                          <![endif]-->
                      <div
                        class="mj-column-per-100 mj-outlook-group-fix"
                        style="
                          font-size: 0px;
                          text-align: left;
                          direction: ltr;
                          display: inline-block;
                          vertical-align: top;
                          width: 100%;
                        "
                      >
                        <table
                          border="0"
                          cellpadding="0"
                          cellspacing="0"
                          role="presentation"
                          style="vertical-align: top"
                          width="100%"
                        >
                          <tbody>
                            <tr>
                              <td style="font-size: 0px; word-break: break-word">
                                <!--[if mso | IE]>
                    
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td height="20" style="vertical-align:top;height:20px;">
                      
                    <![endif]-->
                                <div style="height: 20px"></div>
                                <!--[if mso | IE]>
                    
                        </td></tr></table>
                      
                    <![endif]-->
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <!--[if mso | IE]>
                            </td>
                          
                        </tr>
                      
                                  </table>
                                <![endif]-->
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!--[if mso | IE]>
                          </td>
                        </tr>
                      </table>
                      
                      <table
                         align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600"
                      >
                        <tr>
                          <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
                      <![endif]-->
            <div
              style="
                background: #ffffff;
                background-color: #ffffff;
                margin: 0px auto;
                border-radius: 4px;
                max-width: 600px;
              "
            >
              <table
                align="center"
                border="0"
                cellpadding="0"
                cellspacing="0"
                role="presentation"
                style="
                  background: #ffffff;
                  background-color: #ffffff;
                  width: 100%;
                  border-radius: 4px;
                "
              >
                <tbody>
                  <tr>
                    <td
                      style="
                        direction: ltr;
                        font-size: 0px;
                        padding: 20px 0;
                        text-align: center;
                      "
                    >
                      <!--[if mso | IE]>
                                  <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                
                            <tr>
                              <td
                                 class="" width="600px"
                              >
                          
                      <table
                         align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600"
                      >
                        <tr>
                          <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
                      <![endif]-->
                      <div style="margin: 0px auto; max-width: 600px">
                        <table
                          align="center"
                          border="0"
                          cellpadding="0"
                          cellspacing="0"
                          role="presentation"
                          style="width: 100%"
                        >
                          <tbody>
                            <tr>
                              <td
                                style="
                                  direction: ltr;
                                  font-size: 0px;
                                  padding: 20px 0;
                                  text-align: center;
                                "
                              >
                                <!--[if mso | IE]>
                                  <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                
                        <tr>
                      
                            <td
                               class="" style="vertical-align:top;width:600px;"
                            >
                          <![endif]-->
                                <div
                                  class="mj-column-per-100 mj-outlook-group-fix"
                                  style="
                                    font-size: 0px;
                                    text-align: left;
                                    direction: ltr;
                                    display: inline-block;
                                    vertical-align: top;
                                    width: 100%;
                                  "
                                >
                                  <table
                                    border="0"
                                    cellpadding="0"
                                    cellspacing="0"
                                    role="presentation"
                                    style="vertical-align: top"
                                    width="100%"
                                  >
                                    <tbody>
                                      <tr>
                                        <td
                                          align="center"
                                          style="
                                            font-size: 0px;
                                            padding: 8px 0;
                                            word-break: break-word;
                                          "
                                        >
                                          <table
                                            border="0"
                                            cellpadding="0"
                                            cellspacing="0"
                                            role="presentation"
                                            style="
                                              border-collapse: collapse;
                                              border-spacing: 0px;
                                            "
                                          >
                                            <tbody>
                                              <tr>
                                                <td style="width: 150px">
                                                  <img
                                                    height="auto"
                                                    src="https://chicandholland.com/LOGO.png"
                                                    style="
                                                      border: 0;
                                                      display: block;
                                                      outline: none;
                                                      text-decoration: none;
                                                      height: auto;
                                                      width: 100%;
                                                      font-size: 13px;
                                                    "
                                                    width="150"
                                                  />
                                                </td>
                                              </tr>
                                            </tbody>
                                          </table>
                                        </td>
                                      </tr>
                                      <tr>
                                        <td
                                          style="
                                            font-size: 0px;
                                            padding: 10px 25px;
                                            word-break: break-word;
                                          "
                                        >
                                          <p
                                            style="
                                              border-top: dashed 1px lightgrey;
                                              font-size: 1px;
                                              margin: 0px auto;
                                              width: 100%;
                                            "
                                          ></p>
                                          <!--[if mso | IE]>
                                            <table
                                              align="center"
                                              border="0"
                                              cellpadding="0"
                                              cellspacing="0"
                                              style="
                                                border-top: dashed 1px lightgrey;
                                                font-size: 1px;
                                                margin: 0px auto;
                                                width: 550px;
                                              "
                                              role="presentation"
                                              width="550px"
                                            >
                                              <tr>
                                                <td style="height: 0; line-height: 0">
                                                  &nbsp;
                                                </td>
                                              </tr>
                                            </table>
                                          <![endif]-->
                                        </td>
                                      </tr>
                                      <tr>
                                        <td
                                          align="left"
                                          style="
                                            font-size: 0px;
                                            padding: 10px 25px;
                                            word-break: break-word;
                                          "
                                        >
                                          <div
                                            style="
                                              font-family: Roboto, Helvetica, Arial,
                                                sans-serif;
                                              font-size: 24px;
                                              font-weight: 300;
                                              line-height: 30px;
                                              text-align: left;
                                              color: #000000;
                                            "
                                          >
                                            New form submission in contact us page
                                          </div>
                                        </td>
                                      </tr>
                                      <tr>
                                        <td
                                          align="left"
                                          style="
                                            font-size: 0px;
                                            padding: 10px 25px;
                                            word-break: break-word;
                                          "
                                        >
                                          <div
                                            style="
                                              font-family: Roboto, Helvetica, Arial,
                                                sans-serif;
                                              font-size: 14px;
                                              font-weight: 300;
                                              line-height: 20px;
                                              text-align: left;
                                              color: #000000;
                                            "
                                          >
                                            There was a new submission in contact
                                            page, here are form details:
                                          </div>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                                <!--[if mso | IE]>
                            </td>
                          
                        </tr>
                      
                                  </table>
                                <![endif]-->
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <!--[if mso | IE]>
                          </td>
                        </tr>
                      </table>
                      
                              </td>
                            </tr>
                          
                            <tr>
                              <td
                                 class="" width="600px"
                              >
                          
                      <table
                         align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600"
                      >
                        <tr>
                          <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
                      <![endif]-->
                      <div style="margin: 0px auto; max-width: 600px">
                        <table
                          align="center"
                          border="0"
                          cellpadding="0"
                          cellspacing="0"
                          role="presentation"
                          style="width: 100%"
                        >
                          <tbody>
                            <tr>
                              <td
                                style="
                                  direction: ltr;
                                  font-size: 0px;
                                  padding: 0;
                                  text-align: center;
                                "
                              >
                                <!--[if mso | IE]>
                                  <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                
                        <tr>
                      
                            <td
                               class="" style="vertical-align:top;width:600px;"
                            >
                          <![endif]-->
                                <div
                                  class="mj-column-per-100 mj-outlook-group-fix"
                                  style="
                                    font-size: 0px;
                                    text-align: left;
                                    direction: ltr;
                                    display: inline-block;
                                    vertical-align: top;
                                    width: 100%;
                                  "
                                >
                                  <table
                                    border="0"
                                    cellpadding="0"
                                    cellspacing="0"
                                    role="presentation"
                                    style="vertical-align: top"
                                    width="100%"
                                  >
                                    <tbody>
                                      <tr>
                                        <td
                                          align="left"
                                          class="receipt-table"
                                          style="
                                            font-size: 0px;
                                            padding: 10px 25px;
                                            word-break: break-word;
                                          "
                                        >
                                          <table
                                            cellpadding="0"
                                            cellspacing="0"
                                            width="100%"
                                            border="0"
                                            style="
                                              color: #000000;
                                              font-family: Roboto, Helvetica, Arial,
                                                sans-serif;
                                              font-size: 13px;
                                              line-height: 22px;
                                              table-layout: auto;
                                              width: 100%;
                                              border: none;
                                            "
                                          >
                                            <tbody>
                                              <tr valign="top">
                                                <td
                                                  width="60%"
                                                  style="
                                                    font-size: 14px;
                                                    line-height: 16px;
                                                    word-break: normal;
                                                  "
                                                >
                                                  <p
                                                    style="
                                                      margin: 0 0 5px 0;
                                                      padding-bottom: 10px;
                                                    "
                                                  >
                                                    <b>Name : </b>
                                                    <span style="color: #aca9bb">
                                                      ${name}
                                                    </span>
                                                  </p>
                                                </td>
                                              </tr>
                                              <tr valign="top">
                                                <td
                                                  width="60%"
                                                  style="
                                                    font-size: 14px;
                                                    line-height: 16px;
                                                    word-break: normal;
                                                  "
                                                >
                                                  <p
                                                    style="
                                                      margin: 0 0 5px 0;
                                                      padding-bottom: 10px;
                                                    "
                                                  >
                                                    <b>Email : </b>
                                                    <span style="color: #aca9bb">
                                                      ${email}
                                                    </span>
                                                  </p>
                                                </td>
                                              </tr>
                                              <tr valign="top">
                                                <td
                                                  width="60%"
                                                  style="
                                                    font-size: 14px;
                                                    line-height: 16px;
                                                    word-break: normal;
                                                  "
                                                >
                                                  <p
                                                    style="
                                                      margin: 0 0 5px 0;
                                                      padding-bottom: 10px;
                                                    "
                                                  >
                                                    <b>Phone Number : </b>
                                                    <span style="color: #aca9bb">
                                                      ${phoneNumber}
                                                    </span>
                                                  </p>
                                                </td>
                                              </tr>
                                              <tr valign="top">
                                                <td
                                                  width="60%"
                                                  style="
                                                    font-size: 14px;
                                                    line-height: 16px;
                                                    word-break: normal;
                                                  "
                                                >
                                                  <p
                                                    style="
                                                      margin: 0 0 5px 0;
                                                      padding-bottom: 10px;
                                                    "
                                                  >
                                                    <b>Subject: </b>
                                                    <span style="color: #aca9bb">
                                                      ${subject}
                                                    </span>
                                                  </p>
                                                </td>
                                              </tr>
                                              <tr valign="top">
                                                <td
                                                  width="60%"
                                                  style="
                                                    font-size: 14px;
                                                    line-height: 16px;
                                                    word-break: normal;
                                                  "
                                                >
                                                  <p
                                                    style="
                                                      margin: 0 0 5px 0;
                                                      padding-bottom: 10px;
                                                    "
                                                  >
                                                    <b>State: </b>
                                                    <span style="color: #aca9bb">
                                                      ${state}
                                                    </span>
                                                  </p>
                                                </td>
                                              </tr>
                                              <tr valign="top">
                                                <td
                                                  width="60%"
                                                  style="
                                                    font-size: 14px;
                                                    line-height: 16px;
                                                    word-break: normal;
                                                  "
                                                >
                                                  <p
                                                    style="
                                                      margin: 0 0 5px 0;
                                                      padding-bottom: 10px;
                                                    "
                                                  >
                                                    <b>Country: </b>
                                                    <span style="color: #aca9bb">
                                                      ${country}
                                                    </span>
                                                  </p>
                                                </td>
                                              </tr>
                                              <tr valign="top">
                                                <td
                                                  width="60%"
                                                  style="
                                                    font-size: 14px;
                                                    line-height: 16px;
                                                    word-break: normal;
                                                  "
                                                >
                                                  <p
                                                    style="
                                                      margin: 0 0 5px 0;
                                                      padding-bottom: 10px;
                                                    "
                                                  >
                                                    <b>Message: </b>
                                                    <span style="color: #aca9bb">
                                                      ${message}
                                                    </span>
                                                  </p>
                                                </td>
                                              </tr>
                                            </tbody>
                                          </table>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                                <!--[if mso | IE]>
                            </td>
                          
                        </tr>
                      
                                  </table>
                                <![endif]-->
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <!--[if mso | IE]>
                          </td>
                        </tr>
                      </table>
                      
                              </td>
                            </tr>
                          
                            <tr>
                              <td
                                 class="" width="600px"
                              >
                          
                      <table
                         align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600"
                      >
                        <tr>
                          <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
                      <![endif]-->
                      <div style="margin: 0px auto; max-width: 600px">
                        <table
                          align="center"
                          border="0"
                          cellpadding="0"
                          cellspacing="0"
                          role="presentation"
                          style="width: 100%"
                        >
                          <tbody>
                            <tr>
                              <td
                                style="
                                  direction: ltr;
                                  font-size: 0px;
                                  padding: 20px 0;
                                  text-align: center;
                                "
                              >
                                <!--[if mso | IE]>
                                  <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                
                        <tr>
                      
                            <td
                               class="" style="vertical-align:top;width:600px;"
                            >
                          <![endif]-->
      
                                <!--[if mso | IE]>
                            </td>
                          
                        </tr>
                      
                                  </table>
                                <![endif]-->
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <!--[if mso | IE]>
                          </td>
                        </tr>
                      </table>
                      
                              </td>
                            </tr>
                          
                                  </table>
                                <![endif]-->
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!--[if mso | IE]>
                          </td>
                        </tr>
                      </table>
                      
                      <table
                         align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600"
                      >
                        <tr>
                          <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
                      <![endif]-->
            <!--[if mso | IE]>
                          </td>
                        </tr>
                      </table>
                      
                      <table
                         align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600"
                      >
                        <tr>
                          <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
                      <![endif]-->
            <div style="margin: 0px auto; max-width: 600px">
              <table
                align="center"
                border="0"
                cellpadding="0"
                cellspacing="0"
                role="presentation"
                style="width: 100%"
              >
                <tbody>
                  <tr>
                    <td
                      style="
                        direction: ltr;
                        font-size: 0px;
                        padding: 20px 0;
                        text-align: center;
                      "
                    >
                      <!--[if mso | IE]>
                                  <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                
                        <tr>
                      
                            <td
                               class="" style="vertical-align:top;width:600px;"
                            >
                          <![endif]-->
                      <div
                        class="mj-column-per-100 mj-outlook-group-fix"
                        style="
                          font-size: 0px;
                          text-align: left;
                          direction: ltr;
                          display: inline-block;
                          vertical-align: top;
                          width: 100%;
                        "
                      >
                        <table
                          border="0"
                          cellpadding="0"
                          cellspacing="0"
                          role="presentation"
                          style="vertical-align: top"
                          width="100%"
                        >
                          <tbody>
                            <tr>
                              <td style="font-size: 0px; word-break: break-word">
                                <!--[if mso | IE]>
                    
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td height="1" style="vertical-align:top;height:1px;">
                      
                    <![endif]-->
                                <div style="height: 1px"></div>
                                <!--[if mso | IE]>
                    
                        </td></tr></table>
                      
                    <![endif]-->
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <!--[if mso | IE]>
                            </td>
                          
                        </tr>
                      
                                  </table>
                                <![endif]-->
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!--[if mso | IE]>
                          </td>
                        </tr>
                      </table>
                      <![endif]-->
          </div>
        </body>
      </html>
      `,
            to: "info@chicandholland.com",
            // to: "rehan@ymtsindia.org",
            replyTo: email,
            inReplyTo: email,
            subject: `Contact Us form submission - ${subject}`,
        });

        res.json({
            success: true,
            message: "Your message has been sent successfully",
        });
    })
);

// router.post(
//   "/",
//   asyncHandler(async (req: Request, res: Response) => {
//     const contact = Contactus.create({ ...req.body });
//     await contact.save();
//     res.json({ msg: created(RES_NAME) });
//   })
// );

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const entries = await Contactus.find({ order: { createdAt: "DESC" } });
    res.json(entries);
  })
);



// router.delete(
//   "/:id",
//   dbDelete(TABLE_NAMES.CONTACT_US),
//   asyncHandler(async (req: Request, res: Response) => {
//     res.json({ msg: deleted(RES_NAME) });
//   })
// );
// MARK SINGLE MESSAGE AS READ
router.patch(
  "/:id/read",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const result = await Contactus.createQueryBuilder()
      .update(Contactus)
      .set({ isRead: true })
      .where("id = :id", { id })
      .execute();

    if (result.affected && result.affected > 0) {
      res.json({ 
        success: true, 
        message: "Message marked as read" 
      });
    } else {
      res.status(404).json({ 
        success: false, 
        message: "Message not found" 
      });
    }
  })
);

// MARK ALL MESSAGES AS READ (keep this if you need it)
router.patch(
  "/mark-read/all",
  asyncHandler(async (req: Request, res: Response) => {
    await Contactus.createQueryBuilder()
      .update(Contactus)
      .set({ isRead: true })
      .where("isRead = :read", { read: false })
      .execute();

    res.json({ success: true, message: "All messages marked as read" });
  })
);



export default router;
