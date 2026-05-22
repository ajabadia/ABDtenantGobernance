const fs = require('fs');

const addKeys = (file, keys) => {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  
  if (!data.admin) data.admin = {};
  if (!data.adminPortal) data.adminPortal = {};
  if (!data.home) data.home = {};

  Object.assign(data.admin, keys.admin || {});
  Object.assign(data.adminPortal, keys.adminPortal || {});
  Object.assign(data.home, keys.home || {});

  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

addKeys('messages/es.json', {
  admin: {
    brandCardDescFull: "Ajusta los parámetros visuales para <tenant>{tenantName}</tenant>. Los cambios impactan a todos sus usuarios de forma instantánea."
  },
  adminPortal: {
    gobernanza: "Gobernanza",
    abdTitle: "ABD",
    adminDescriptionFull: "Consola de control federada y gobernanza en caliente del tenant <tenant>{tenantId}</tenant>."
  },
  home: {
    abdTitle: "ABD"
  }
});

addKeys('messages/en.json', {
  admin: {
    brandCardDescFull: "Adjust visual parameters for <tenant>{tenantName}</tenant>. Changes will impact all users instantly."
  },
  adminPortal: {
    gobernanza: "Governance",
    abdTitle: "ABD",
    adminDescriptionFull: "Federated control console and hot governance for tenant <tenant>{tenantId}</tenant>."
  },
  home: {
    abdTitle: "ABD"
  }
});
