const data = require("./data.json");
const axios = require("axios");
const fs = require("fs");

let UserName = null;
let PWD = null;
let ConStr = null;

let auth_url = "";
let auth_uname = "";
let auth_pwd = "";

//Step 1 Getting VCAP_Servces Data
const getVCAP_SERVICES = () => {
	console.log("**********Getting ENV Variables***********");
	if (process.env.VCAP_SERVICES === undefined) {
		if (data.credhub.length > 0) {
			auth_url = data.credhub[0].credentials.mediationAuthTokenUrl;
			auth_uname = data.credhub[0].credentials["config.oauth.username"];
			auth_pwd = data.credhub[0].credentials["config.oauth.password"];
			return `${auth_url}|${auth_uname}|${auth_pwd}|DIT|flex-mediation-userauth-dit.r1.pcf.dell.com`; //spacename and uris is hardcoded
		}
	} else {
		const realData = JSON.parse(process.env.VCAP_SERVICES);
		const spacename = JSON.parse(process.env.VCAP_APPLICATION);
		const url = spacename.application_uris[0];
		if (realData.credhub.length > 0) {
			auth_url = realData.credhub[0].credentials.mediationAuthTokenUrl;
			auth_uname = realData.credhub[0].credentials["config.oauth.username"];
			auth_pwd = realData.credhub[0].credentials["config.oauth.password"];
			return `${auth_url}|${auth_uname}|${auth_pwd}|${spacename.space_name}|${url}`;
		}
	}
};

// Step 2 - Getting Auth Token
const FetchAuthToken = async (url, uname, pwd, spacename) => {
	// console.log(url);
	// console.log(uname);
	// console.log(pwd);
	// console.log(spacename);
	const token = Buffer.from(`${uname}:${pwd}`, "utf-8").toString("base64");
	// console.log("Token is :-----", token);
	await axios
		.get(url, {
			headers: {
				Authorization: `Basic ${token}`,
			},
		})
		.then(function (response) {
			console.log("----------Fetching Auth Token Successfull-----------");
			// console.log(response);
			// const Fdata = new Uint8Array(Buffer.from(`${response.data}`));
			fs.writeFile("xyz.txt", JSON.stringify(response.data), (err) => {
				if (err) throw err;
				// console.log("Token ExpTime", response.data.expireTime);
				// console.log("Token", response.data.token);
				console.log("Token Saved Successfully");
			});
			getDBConnection(spacename, response.data.token);
			return response.data.token;
		})
		.catch(function (error) {
			console.log("----------Error in Fetching Auth Token------------");
			console.log(error.message);
			return "Error on getting Token";
		});
};

//step 3 Getting DB Details
const getDBConnection = async (spacename, AccessToken) => {
	console.log("****************Getting DB Details****************");
	// console.log("Access Token is :-----", AccessToken);
	let URL = "";
	URL =
		`${process.env.NODE_CONFIG_URL}/application/${process.env.NODE_CONFIG_PROFILE}/${process.env.NODE_CONFIG_LABEL}`
			.toString()
			.trim();
	console.log("The Dynamic URL is :--- ", URL);
	// if (spacename.toUpperCase().indexOf("DIT") > -1) {
	URL =
		"https://flex-rating-config-server.r1.pcf.dell.com/application/dit%2Cdit_rating%2CVault-DIT_ADMIN/Release-FY22-0702";
	// } else if (spacename.toUpperCase().indexOf("GE4") > -1) {
	// 	URL =
	// 		"https://flex-rating-config-server.r1.pcf.dell.com/application/ge4%2Cge4_rating%2CVault-GE4/Release-FY22-0202";
	// } else if (spacename.toUpperCase().indexOf("GE2") > -1) {
	// 	URL =
	// 		"https://flex-rating-config-server.r1.pcf.dell.com/application/ge2%2Cge2_rating%2CVault-GE2/Release-FY22-0202";
	// 	// }else if (spacename.toUpperCase() === "PROD-GEN-NON-REGION-SPECIFIC") {
	// } else {
	// 	URL =
	// 		"https://flex-rating-config-server.g1p.pcf.dell.com/application/prod%2Cprod_rating%2CVault-Prod/Release-FY22-0202";
	// }

	const headers = {
		"Content-Type": "application/json",
		"X-Config-Token": `Bearer ${AccessToken}`,
	};
	await axios
		.get(URL, { headers: headers })
		.then(function (response) {
			// console.log("Complete Output" + response);
			// console.log(
			// 	"propertySources[0] :---" + response.data.propertySources[0].source
			// );
			// console.log(
			// 	"propertySources[1] :-----" + response.data.propertySources[1].source
			// );
			const str =
				response.data.propertySources[1].source["spring.datasource.url"];
			UserName = response.data.propertySources[0].source.boltDbUsername;
			PWD = response.data.propertySources[0].source.boltDbPassword;
			//
			let agg_data = `flex-mediation-ui.${process.env.NODE_ENV}.agg-data`;
			let agg_data_ins = `"flex-mediation-ui.${process.env.NODE_ENV}.agg-data-insert"`;
			let agg_data_upd = `flex-mediation-ui.${process.env.NODE_ENV}.agg-data-update`;
			let brm_data = `flex-mediation-ui.${process.env.NODE_ENV}.brm-data`;
			let monthlyrecon = `flex-mediation-ui.${process.env.NODE_ENV}.monthlyrecon`;
			let telemetry = `flex-mediation-ui.url.telemetry`;

			agg_data = response.data.propertySources[1].source[agg_data];
			agg_data_ins = response.data.propertySources[1].source[agg_data_ins];
			agg_data_upd = response.data.propertySources[1].source[agg_data_upd];
			brm_data = response.data.propertySources[1].source[brm_data];
			monthlyrecon = response.data.propertySources[1].source[monthlyrecon];
			telemetry = response.data.propertySources[1].source[telemetry];

			// console.log(response.data);
			console.log(
				"New URLS:---",
				`${agg_data}|${agg_data_ins}|${agg_data_upd}|${brm_data}|${monthlyrecon}|${telemetry}`
			);
			// const host = str.slice(
			// 	5 + str.indexOf("HOST"),
			// 	str.indexOf(")", str.indexOf("HOST"))
			// );
			// const port = str.slice(
			// 	5 + str.indexOf("PORT"),
			// 	str.indexOf(")", str.indexOf("PORT"))
			// );
			// const servicename = str.slice(
			// 	13 + str.indexOf("SERVICE_NAME"),
			// 	str.indexOf(")", str.indexOf("SERVICE_NAME"))
			// );
			// ConStr = `${host}:${port}/${servicename}`;
			// console.log("DB Data String :-", `${ConStr}`);
			ConStr = str.slice(str.indexOf("@") + 1, str.length);
			const Fdata = new Uint8Array(
				Buffer.from(
					`${UserName}|${PWD}|${ConStr}|${agg_data}|${agg_data_ins}|${agg_data_upd}|${brm_data}|${monthlyrecon}|${telemetry}`
				)
			);
			fs.writeFile("message.txt", Fdata, (err) => {
				if (err) throw err;
				console.log("*******DB Details Saved*******");
			});
			console.log("*********Getting DB detail is success**********");
		})
		.catch(function (error) {
			console.log("************Error in getting DB details*************");
			console.log(error.message);
		});
};

module.exports.GetVCAP = getVCAP_SERVICES;
module.exports.GetToken = FetchAuthToken;
module.exports.GetDBCon = getDBConnection;
module.exports.UserName = UserName;
module.exports.PWD = PWD;
module.exports.ConStr = ConStr;
module.exports.auth_url = auth_url;
module.exports.auth_pwd = auth_pwd;
module.exports.auth_uname = auth_uname;
