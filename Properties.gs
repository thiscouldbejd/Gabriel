// -- General Getters/Setters -- //
function getScalarProperty(service, name, default_value) {
  var value = service.getProperty(name);
  if (default_value && (!value || value == "")) {
    return default_value;
  } else {
    return value;
  }
}

function getArrayProperty(service, name, default_value) {
  var values = service.getProperty(name);
  if (values && values != "") {
     return values.split(c.delineator);
  } else if (default_value) {
    return default_value;
  } else {
    return [];
  }
}

function setScalarProperty(service, name, value) {
  if (value && value != "") {
    service.setProperty(name, value);
  } else {
    service.deleteProperty(name);
  }
}

function setArrayProperty(service, name, values) {
  if (values && values.length > 0) {
    service.setProperty(name, values.join(c.delineator));
  } else {
    service.deleteProperty(name);
  }
}
// -- General Getters/Setters -- //

// -- General Clear -- //
function clearAllProperties(service) {
  var properties = Object.keys(service.getProperties());
  for (var i = 0; i < properties.length; i++) {
      if (properties[i].indexOf(prefix) == 0) {
          service.deleteProperty(properties[i]);
      }
  }
}

function clearPrefixedProperties(service, config, prefix) {
  var properties = Object.keys(config);
  for (var i = 0; i < properties.length; i++) {
      if (properties[i].indexOf(prefix) == 0) {
          service.deleteProperty(config[properties[i]]);
      }
  }
}
// -- General Clear -- //
