export function synthesizeClientNameFromSession(device: AttachedSession) {
  const uaBrowser = device.uaBrowser;
  const uaBrowserVersion = device.uaBrowserVersion;
  const uaOS = device.uaOS;
  const uaOSVersion = device.uaOSVersion;
  const uaFormFactor = device.uaFormFactor;
  let result = '';

  if (uaBrowser) {
    if (uaBrowserVersion) {
      const splitIndex = uaBrowserVersion.indexOf('.');
      result = `${uaBrowser} ${
        splitIndex === -1
          ? uaBrowserVersion
          : uaBrowserVersion.substr(0, splitIndex)
      }`;
    } else {
      result = uaBrowser;
    }

    if (uaOS || uaFormFactor) {
      result += ', ';
    }
  }

  if (uaFormFactor) {
    return `${result}${uaFormFactor}`;
  }

  if (uaOS) {
    result += uaOS;

    if (uaOSVersion) {
      result += ` ${uaOSVersion}`;
    }
  }

  return result;
}
