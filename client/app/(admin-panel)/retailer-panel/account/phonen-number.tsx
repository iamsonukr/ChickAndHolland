"use client";

import { parsePhoneNumber } from "react-phone-number-input";

const ParsedPhoneNumbers = ({ phoneNumber }: { phoneNumber: string }) => {
  const phoneNumberDetails = parsePhoneNumber(phoneNumber);
  return (
    <p>
      +{phoneNumberDetails?.countryCallingCode}{" "}
      {phoneNumberDetails?.nationalNumber}
    </p>
  );
};

export default ParsedPhoneNumbers;
