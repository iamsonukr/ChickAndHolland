export const contactUsEmailTemplate = ({
  name,
  email,
  phoneNumber,
  subject,
  message,
  state,
  country,
}: {
  name: string;
  email: string;
  phoneNumber: string;
  subject: string;
  message: string;
  state: string;
  country: string;
}) => `<!DOCTYPE html>
<html
  lang="en"
  xmlns="http://www.w3.org/1999/xhtml"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office"
>
  <head>
    <title>New Enquiry - Chic & Holland</title>
    <!--[if !mso]><!-- -->
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <!--<![endif]-->
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type="text/css">
      #outlook a { padding: 0; }
      body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      table, td { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
      img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
      p { display: block; margin: 13px 0; }
    </style>
    <!--[if mso]>
      <xml>
        <o:OfficeDocumentSettings>
          <o:AllowPNG />
          <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
      </xml>
    <![endif]-->
    <link href="https://fonts.googleapis.com/css?family=Roboto:100,300,400,700" rel="stylesheet" type="text/css" />
    <style type="text/css">
      @import url(https://fonts.googleapis.com/css?family=Roboto:100,300,400,700);
      @media only screen and (min-width: 480px) {
        .mj-column-per-100 { width: 100% !important; max-width: 100%; }
      }
      @media only screen and (max-width: 480px) {
        table.mj-full-width-mobile { width: 100% !important; }
        td.mj-full-width-mobile { width: auto !important; }
      }
      a, span, td, th { -webkit-font-smoothing: antialiased !important; -moz-osx-font-smoothing: grayscale !important; }
    </style>
  </head>

  <body style="background-color: #54595f">
    <div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
      Preview - New Enquiry - Chic & Holland
    </div>

    <div style="background-color: #54595f">
      <div style="margin: 0px auto; max-width: 600px">
        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%">
          <tbody><tr><td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;">
            <div style="height: 20px"></div>
          </td></tr></tbody>
        </table>
      </div>

      <!-- White card -->
      <div style="background:#ffffff;margin:0px auto;border-radius:4px;max-width:600px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;width:100%;border-radius:4px;">
          <tbody><tr><td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;">

            <!-- Header -->
            <div style="margin:0px auto;max-width:600px;">
              <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%">
                <tbody><tr><td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;">
                  <div style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                    <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top" width="100%">
                      <tbody>
                        <tr>
                          <td align="center" style="font-size:0px;padding:8px 0;word-break:break-word;">
                            <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;border-spacing:0px;">
                              <tbody><tr><td style="width:150px;">
                                <img height="auto" src="https://chicandholland.com/LOGO.png"
                                  style="border:0;display:block;outline:none;text-decoration:none;height:auto;width:100%;font-size:13px;"
                                  width="150" />
                              </td></tr></tbody>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="font-size:0px;padding:10px 25px;word-break:break-word;">
                            <p style="border-top:dashed 1px lightgrey;font-size:1px;margin:0px auto;width:100%;"></p>
                          </td>
                        </tr>
                        <tr>
                          <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                            <div style="font-family:Roboto,Helvetica,Arial,sans-serif;font-size:24px;font-weight:300;line-height:30px;text-align:left;color:#000000;">
                              New form submission in contact us page
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                            <div style="font-family:Roboto,Helvetica,Arial,sans-serif;font-size:14px;font-weight:300;line-height:20px;text-align:left;color:#000000;">
                              There was a new submission in contact page, here are the form details:
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </td></tr></tbody>
              </table>
            </div>

            <!-- Form Details Table -->
            <div style="margin:0px auto;max-width:600px;">
              <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%">
                <tbody><tr><td style="direction:ltr;font-size:0px;padding:0;text-align:center;">
                  <div style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                    <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top" width="100%">
                      <tbody><tr>
                        <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                          <table cellpadding="0" cellspacing="0" width="100%" border="0"
                            style="color:#000000;font-family:Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:22px;table-layout:auto;width:100%;border:none;">
                            <tbody>
                              ${[
                                ["Name", name],
                                ["Email", email],
                                ["Phone Number", phoneNumber],
                                ["Subject", subject],
                                ["State", state],
                                ["Country", country],
                                ["Message", message],
                              ]
                                .map(
                                  ([label, value]) => `
                              <tr valign="top">
                                <td width="60%" style="font-size:14px;line-height:16px;word-break:normal;">
                                  <p style="margin:0 0 5px 0;padding-bottom:10px;">
                                    <b>${label}: </b>
                                    <span style="color:#aca9bb">${value}</span>
                                  </p>
                                </td>
                              </tr>`
                                )
                                .join("")}
                            </tbody>
                          </table>
                        </td>
                      </tr></tbody>
                    </table>
                  </div>
                </td></tr></tbody>
              </table>
            </div>

          </td></tr></tbody>
        </table>
      </div>

      <div style="margin:0px auto;max-width:600px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%">
          <tbody><tr><td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;">
            <div style="height:1px"></div>
          </td></tr></tbody>
        </table>
      </div>
    </div>
  </body>
</html>`;