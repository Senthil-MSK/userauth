require("dotenv").config();
var oracledb = require("oracledb");
var express = require("express");
var cors = require("cors");
const Config = require("./ConfigAuth");
const fs = require("fs");
// const bodyParser = require("body-parser");
// const { response } = require("express");
const { default: axios } = require("axios");
const { response } = require("express");
// const { resolve } = require("path");
// ;

var app = express();
app.use(express.json());
app.use(cors());
// app.use(express.urlencoded());

// var urlencodedParser = bodyParser.urlencoded({ extended: false });

let Config_User = null;
let Config_pwd = null;
let Config_Con = null;
let AccessToken = "";
let CurrentENV = "";
let app_url = "";
// console.log("LD_LIBRARY_PATH:- ", `${process.env.LD_LIBRARY_PATH}`);
// console.log("GITLAB_USER_LOGIN:- ", `${process.env.GITLAB_USER_LOGIN}`);
// console.log("GITLAB_USER_EMAIL:- ", `${process.env.GITLAB_USER_EMAIL}`);
// console.log("CI_REPOSITORY_URL:- ", `${process.env.CI_REPOSITORY_URL}`);

const Refreshtoken = () => {
	let Token = "";
	fs.readFile("xyz.txt", "utf8", (err, data) => {
		if (err) {
			console.error("Error in RefreshToken() :---", err);
			return;
		}
		// console.log(data);
		Token = JSON.parse(data);
		let ExpTime = new Date(Token.expireTime);
		// console.log("Exp Time :---", ExpTime);
		const diffTime = parseInt(Token.expireTime) - Date.now();
		// console.log("Time Difference :---", diffTime);
		fs.close;
		// console.log(parseInt(diffTime) > 0);
		if (parseInt(diffTime) > 0) {
			// console.log(Token.token);
			AccessToken = Token.token;
		} else {
			let vcapstr = Config.GetVCAP();
			let TokenURL = vcapstr.split("|")[0];
			let TokenUName = vcapstr.split("|")[1];
			let TokenPWD = vcapstr.split("|")[2];
			let SpaceName = vcapstr.split("|")[3];
			// console.log(TokenURL + TokenUName + TokenPWD);
			Config.GetToken(TokenURL, TokenUName, TokenPWD, SpaceName);
			setTimeout(() => {
				fs.readFile("xyz.txt", "utf8", (err, data) => {
					if (err) {
						console.error(err);
						return;
					}
					// console.log("Fresh Token", data);
					console.log("Fresh Token Generated");
					Token = JSON.parse(data);
					fs.close;
					AccessToken = Token.token;
				});
			}, 5000);
		}
	});
};

const FirstCall = () => {
	let vcapstr = Config.GetVCAP();
	// console.log("vcapstr :-------- ", vcapstr);
	let TokenURL = vcapstr.split("|")[0];
	let TokenUName = vcapstr.split("|")[1];
	let TokenPWD = vcapstr.split("|")[2];
	let SpaceName = vcapstr.split("|")[3];
	CurrentENV = vcapstr.split("|")[3];
	app_url = vcapstr.split("|")[4];
	// console.log(TokenURL + TokenUName + TokenPWD);
	console.log("Application URL :---", app_url);
	// Config.GetToken(TokenURL, TokenUName, TokenPWD, SpaceName);
	Config.GetToken(TokenURL, TokenUName, TokenPWD, app_url);
};
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
FirstCall();
// Refreshtoken();

const DBData = () => {
	fs.readFile("message.txt", "utf8", (err, data) => {
		if (err) {
			console.error(err);
			return;
		}
		if (Config_User === undefined) FirstCall();
		Config_User = data.split("|")[0].toString();
		Config_pwd = data.split("|")[1].toString();
		Config_Con = data.split("|")[2].toString();
		// console.log(
		// 	"DB Details :----" + Config_User + "|" + Config_pwd + "|" + Config_Con
		// );
	});
	fs.close;
};
// DBData();

app.get("/", (req, res) => {
	// DBData();
	res.send(
		`<p>
		<h1>API Home Page</h1> 
		</p>`
	);
});

// app.use(DBData);

app.get("/gettokenauth", (req, res) => {
	// let vcapstr = Config.GetVCAP();
	// let TokenURL = vcapstr.split("|")[0];
	// let TokenUName = vcapstr.split("|")[1];
	// let TokenPWD = vcapstr.split("|")[2];
	// res.send(`{"uarg":"${TokenUName}","parg":"${TokenPWD}","url":"${TokenURL}"}`);
	Refreshtoken();
	setTimeout(() => {
		res.send(`{"token":"${AccessToken}"}`);
	}, 2000);
});

app.get("/agg_data", (req, res) => {
	let type_name = "";
	if (parseInt(req.query.type) == 0) {
		type_name = "aggregation";
	} else if (parseInt(req.query.type) == 1) {
		type_name = "master_asset";
	} else if (parseInt(req.query.type) == 2) {
		type_name = "metric_detail_t2";
	} else return;

	Refreshtoken();
	if (CurrentENV === "") FirstCall();
	// http://localhost:5000/agg_data?type=0&payload={%22agreement_id%22:[%22600000816%22],%22agg_start_time%22:1606795200,%22agg_end_time%22:1617339600}
	if (true) {
		setTimeout(() => {
			console.log(
				`{"type_name":"${type_name}","payload":${req.query.payload}}`
			);
			// let payload = JSON.parse(
			// 	`{"type_name":"${type_name}","payload":${req.query.payload}}`
			// );
			let payload = `{"type_name":"${type_name}","payload":${req.query.payload}}`;
			console.log("*************Payload***************");
			console.log("Payload :----", payload);
			const headers = {
				"Content-Type": "application/json",
				Authorization: `Bearer ${AccessToken}`,
			};

			// let cENV = "";
			// if (CurrentENV === "") FirstCall();
			// // console.log(app_url.indexOf("ausmpc") > -1);
			// if (CurrentENV === "DIT") {
			// 	cENV = "-dit.r1.pcf";
			// } else if (CurrentENV === "GE2") {
			// 	cENV = "-ge2.ausvtc01.pcf";
			// } else if (CurrentENV === "GE4") {
			// 	cENV = "-ge4.ausvtc01.pcf";
			// } else if (app_url.indexOf("ausmsc") > -1) {
			// 	cENV = ".ausmsc01.pcf";
			// } else if (app_url.indexOf("ausmpc") > -1) {
			// 	cENV = ".ausmsc01.pcf";
			// }
			let URL = "";
			fs.readFile("message.txt", "utf8", (err, data) => {
				if (err) {
					console.error(err);
					return;
				}
				URL = data.split("|")[3].toString().trim();
			});
			fs.close;

			// let URL = `https://flex-usage-data-service${cENV}.dell.com/api/v2/data_for_ui`;

			console.log("Agg_data URL :----", URL);
			axios
				.post(URL, payload, { headers: headers })
				.then((response) => {
					// console.log(response);
					var CircularJSON = require("circular-json"),
						obj = response,
						str;
					obj.self = obj;
					str = CircularJSON.stringify(obj);
					let s = JSON.parse(str);
					res.send(
						`{"status":"${JSON.stringify(s.status)}","data":${JSON.stringify(
							s.data
						)}}`
					);
				})
				.catch((error) => {
					console.log(
						"***************Error in Agg_data Response********************"
					);
					console.log(error.message);
					res.send(error.message);
				});
		}, 2000);
	}
});

app.post("/brm_data", (req, res) => {
	Refreshtoken();
	// http://localhost:5000/brm_data?tname=dell_flex_billed_mv&amttype=sum(rated_amount)&ptype=/item/staas/consumption/%&sprd=1617210000&eprd=1617210000&select=account_no&aggid=30589808
	console.log("****************Token in BRM_ data ****************");
	// AccessToken = "";
	// console.log("Access Token Length:------------", AccessToken.length);
	if (CurrentENV === "") FirstCall();
	if (true) {
		setTimeout(() => {
			// let payload = req.query.payload;
			console.log("req:--------", req.body);
			let table_name = req.body.table_name;
			let amount_type = req.body.amount_type;
			let poid_type = req.body.poid_type;
			let startPeriod = req.body.startPeriod;
			let endPeriod = req.body.endPeriod;
			let selectedValue = req.body.account_type;
			let agg_id = req.body.val;

			// let table_name = req.query.tname;
			// let amount_type = req.query.amttype;
			// let poid_type = req.query.ptype;
			// let startPeriod = req.query.sprd;
			// let endPeriod = req.query.eprd;
			// let selectedValue = req.query.select;
			// let agg_id = req.query.aggid;

			// let table_name = "dell_flex_billed_mv";
			// let amount_type = "sum(rated_amount)";
			// let poid_type = "Storage%20Usage%20-%";
			// let startPeriod = "1612108800";
			// let endPeriod = "1614528000";
			// let selectedValue = "account_no";
			// let agg_id = "600000816";

			const payload = {
				resultColumn:
					"account_no,bill_info_id,network_session_id, to_char(start_T), event_poid_type," +
					`${amount_type}` +
					",sum(rated_quantity),sum(used_capacity)",
				table: `${table_name}`,
				matchingClause:
					"event_poid_type like '" +
					`${poid_type}'` +
					" and start_t >=" +
					`${startPeriod}` +
					" and start_t <=" +
					`${endPeriod}` +
					" and " +
					`${selectedValue}` +
					"=" +
					`'` +
					`${agg_id}` +
					`'`,
				otherClause:
					"group by account_no,bill_info_id,network_session_id, event_poid_type,to_char((start_T)) order by account_no,bill_info_id,network_session_id, event_poid_type,to_char((start_T))",
				sourceDb: "brm",
				rowLimit: 1499,
			};

			console.log("*************Payload***************");
			// console.log("Payload :----", payload);
			const headers = {
				"Content-Type": "application/json",
				Authorization: `Bearer ${AccessToken}`,
			};

			// let cENV = "";
			// if (CurrentENV === "") FirstCall();
			// if (CurrentENV === "DIT") {
			// 	cENV = "-dit.r1.pcf";
			// } else if (CurrentENV === "GE2") {
			// 	cENV = "-ge2.ausvtc01.pcf";
			// } else if (CurrentENV === "GE4") {
			// 	cENV = "-ge4.ausvtc01.pcf";
			// } else if (app_url.indexOf("ausmsc") > -1) {
			// 	cENV = ".ausmsc01.pcf";
			// } else if (app_url.indexOf("ausmpc") > -1) {
			// 	cENV = ".ausmsc01.pcf";
			// }
			let URL = "";
			fs.readFile("message.txt", "utf8", (err, data) => {
				if (err) {
					console.error(err);
					return;
				}
				URL = data.split("|")[6].toString().trim();
			});
			fs.close;
			// let URL = `https://flex-usage-db-service${cENV}.dell.com/api/v1/usage-service/db`;
			console.log("BRM URL :----", URL);
			axios
				.post(URL, payload, { headers: headers })
				.then((response) => {
					// console.log("Response :---------------", response);
					var CircularJSON = require("circular-json"),
						obj = response,
						str;
					obj.self = obj;
					str = CircularJSON.stringify(obj);
					let s = JSON.parse(str);
					res.send(
						`{"status":"${JSON.stringify(s.status)}","data":${JSON.stringify(
							s.data
						)}}`
					);
					// res.send(s.data);
				})
				.catch((error) => {
					console.log(
						"***************Error in Getting BRM Response********************"
					);
					console.log(error.message);
					res.send(error.message);
				});
		}, 2000);
	}
});

app.get("/monthlyrecon", (req, res) => {
	Refreshtoken();
	// if (CurrentENV === "") FirstCall();
	// console.log(AccessToken);

	let tbl = "";
	let db = "";
	let URL = "";
	fs.readFile("message.txt", "utf8", (err, data) => {
		if (err) {
			console.error(err);
			return;
		}
		console.log(data);
		URL = data.split("|")[7].toString().trim();
	});
	fs.close;

	if (app_url.indexOf("ausmsc") > -1) {
		cENV = ".ausmsc01.pcf";
		tbl = "SUB_MONTHLY_OPS";
		db = "brm";
		// URL =
		// 	"https://flex-usage-db-service.ausmsc01.pcf.dell.com/api/v1/usage-service/db";
	} else if (app_url.indexOf("ausmpc") > -1) {
		cENV = ".ausmsc01.pcf";
		tbl = "SUB_MONTHLY_OPS";
		db = "brm";
		// URL =
		// 	"https://flex-usage-db-service.ausmsc01.pcf.dell.com/api/v1/usage-service/db";
	} else {
		tbl = "svc_npsubmedsitadm.SUB_MONTHLY_OPS";
		db = "bolt";
		// URL =
		// 	"https://flex-usage-db-service-ge4.ausvtc01.pcf.dell.com/api/v1/usage-service/db";
	}

	const body = {
		resultColumn:
			"ACCOUNT_NO,SOLUTION_NAME,ITEM_TYPE,BILL_MONTH,EST_CONTRACTED_COMMITTED_PRICE,EST_CONTRACTED_ONDEMAND_PRICE,DPP_CONTRACTED_COMMITTED_PRICE,DPP_CONTRACTED_ONDEMAND_PRICE,SKU,ONDEMANDSKU,FIRST_USAGE_FOR_CURRENT_MONTH,START_OF_NEXT_MONTH,COMMITTED_CAPACITY_TBHR,QTY_CALC_TBHR,QTY_ACTUAL_TBHR,DURATION_CALC_HR,DURATION_ACTUAL_HR,AMT_CALC_DOLLAR,AMT_ACTUAL_DOLLAR,VERIFY_DURATION_DIFF,VERIFY_AMT,VERIFY_QTY,COMMENTS",
		table: tbl,
		sourceDb: db,
	};

	setTimeout(() => {
		const headers = {
			Authorization: `Bearer ${AccessToken}`,
			"Content-Type": "application/json",
		};
		axios
			.post(URL, body, { headers: headers })
			.then((response) => {
				// console.log(response);
				var CircularJSON = require("circular-json"),
					obj = response,
					str;
				obj.self = obj;
				str = CircularJSON.stringify(obj);
				let s = JSON.parse(str);
				res.send(
					`{"status":"${JSON.stringify(s.status)}","data":${JSON.stringify(
						s.data
					)}}`
				);
			})
			.catch((err) => {
				console.log("Error in Monthly Recon response");
				console.log(err.message);
				res.send(err.message);
			});
	}, 2000);
});

app.post("/telemetry", (req, res) => {
	Refreshtoken();
	if (CurrentENV === "") FirstCall();
	if (true) {
		setTimeout(() => {
			console.log("*************Payload***************");
			// console.log("type_name :----", req.body.type_name);
			console.log("Payload :----", req.body.payload);
			// let payload = `{"type_name":"${req.body.type_name}","payload":"${req.body.payload}"}`;
			let payload = `{"type_name":"telemetry_recon","payload":" ${JSON.stringify(
				req.body.payload
			)}"}`;
			console.log("Complete Payload :----", payload);
			console.log(AccessToken);
			const headers = {
				"Content-Type": "application/json",
				Authorization: `Bearer ${AccessToken}`,
			};

			// let cENV = "";
			// if (CurrentENV === "") FirstCall();
			// // console.log(app_url.indexOf("ausmpc") > -1);
			// if (CurrentENV === "DIT") {
			// 	cENV = "-dit.r1.pcf";
			// } else if (CurrentENV === "GE2") {
			// 	cENV = "-ge2.ausvtc01.pcf";
			// } else if (CurrentENV === "GE4") {
			// 	cENV = "-ge4.ausvtc01.pcf";
			// } else if (app_url.indexOf("ausmsc") > -1) {
			// 	cENV = ".ausmsc01.pcf";
			// } else if (app_url.indexOf("ausmpc") > -1) {
			// 	cENV = ".ausmsc01.pcf";
			// }
			// let URL = `https://flex-usage-data-service${cENV}.dell.com/api/v2/getTelemetryReconData`;
			let URL = "";
			fs.readFile("message.txt", "utf8", (err, data) => {
				if (err) {
					console.error(err);
					return;
				}
				console.log(data);
				URL = data.split("|")[8].toString().trim();

				console.log("URL :----", URL);
				axios
					.post(URL, payload, { headers: headers })
					.then((response) => {
						console.log(response);
						var CircularJSON = require("circular-json"),
							obj = response,
							str;
						obj.self = obj;
						str = CircularJSON.stringify(obj);
						let s = JSON.parse(str);
						res.send(
							`{"status":"${JSON.stringify(s.status)}","data":${JSON.stringify(
								s.data
							)}}`
						);
					})
					.catch((error) => {
						console.log(
							"***************Error in Telemetry Data Response********************"
						);
						console.log(error.message);
						res.send(error.message);
					});
			});
			fs.close;
		}, 2000);
	}
});

app.get("/common", (req, res) => {
	DBData();
	oracledb.getConnection(
		{
			user: Config_User,
			password: Config_pwd,
			connectString: Config_Con,
		},
		function (emailerr1, connection) {
			if (emailerr1) {
				console.error(emailerr1);
				res.send(emailerr1);
				return;
			}
			console.log("Log is :---", req.query.sql);
			connection.execute(`${req.query.sql}`, function (emailerr2, result) {
				if (emailerr2) {
					console.error(emailerr2);
					res.send(emailerr2);
					return;
				}
				console.log(result);
				// result.rows.length
				res.send(result);
				setTimeout(() => {
					connection.commit();
				}, 200);
				// connection.close(function (emailerr3) {
				// 	if (emailerr3) {
				// 		console.log(emailerr3);
				// 	}
				// });
			});
			// }
		}
	);
});

app.get("/email", (req, res) => {
	DBData();
	oracledb.getConnection(
		{
			user: Config_User,
			password: Config_pwd,
			connectString: Config_Con,
		},
		function (emailerr1, connection) {
			if (emailerr1) {
				console.error(emailerr1);
				res.send(emailerr1);
				return;
			}
			console.log("Log is", req.query.em);
			connection.execute(
				`SELECT user_status from usager_userlist where upper(user_email)=upper('${req.query.em}') `,
				function (emailerr2, result) {
					if (emailerr2) {
						console.error(emailerr2);
						res.send(emailerr2);
						return;
					}
					console.log(result.rows.length);
					// result.rows.length

					if (result.rows.length === 0) {
						res.send(Array("firsttime"));
					} else {
						res.send(result.rows);
					}
					connection.close(function (emailerr3) {
						if (emailerr3) {
							console.log(emailerr3);
						}
					});
				}
			);
			// }
		}
	);
});

app.get("/activateuser", (req, res) => {
	DBData();
	oracledb.getConnection(
		{
			user: Config_User,
			password: Config_pwd,
			connectString: Config_Con,
		},
		function (activateusererr1, connection) {
			if (activateusererr1) {
				console.error(activateusererr1);
				res.send(activateusererr1);
				return;
			}
			console.log("Log is", req.query.email);
			connection.execute(
				`update usager_userlist set user_status ='active' where upper(user_email)=upper('${req.query.email}') `,
				function (activateusererr2, result) {
					if (activateusererr2) {
						console.error(activateusererr2);
						res.send(activateusererr2);
						return;
					}
					console.log(result);
					res.send("Updated");
					connection.commit();
					// connection.close(function (err) {
					// 	if (err) {
					// 		console.log(err);
					// 	}
					// });
				}
			);
			// }
		}
	);
});

app.get("/userStatus", (req, res) => {
	DBData();
	oracledb.getConnection(
		{
			user: Config_User,
			password: Config_pwd,
			connectString: Config_Con,
		},
		function (userStatuserr1, connection) {
			if (userStatuserr1) {
				console.error(userStatuserr1);
				res.send(userStatuserr1);
				return;
			}

			console.log("Log is", req.query.em);
			// if (req.query.roles.length > 0) {
			connection.execute(
				`select user_status from usager_userlist where user_email ='${req.query.em}'`,
				function (userStatuserr2, result) {
					if (userStatuserr2) {
						console.error(userStatuserr2);
						return;
					}
					// console.log(result.rows);
					res.send(result.rows);
					connection.close(function (userStatuserr3) {
						if (userStatuserr3) {
							console.log(userStatuserr3);
						}
					});
				}
			);
			// }
		}
	);
});

app.get("/roleslist", (req, res) => {
	DBData();
	oracledb.getConnection(
		{
			user: Config_User,
			password: Config_pwd,
			connectString: Config_Con,
		},
		function (roleslisterr1, connection) {
			if (roleslisterr1) {
				console.error(roleslisterr1);
				res.send(roleslisterr1);
				return;
			}

			console.log("Log is", req.query.roles);
			// if (req.query.roles.length > 0) {
			connection.execute(
				"select (role_id||','||role_name||','||status)as roles from usager_roles  order by role_id",
				function (roleslisterr2, result) {
					if (roleslisterr2) {
						console.error(roleslisterr2);
						return;
					}
					console.log(result.rows);
					res.send(result.rows);
					connection.close(function (roleslisterr3) {
						if (roleslisterr3) {
							console.log(roleslisterr3);
						}
					});
				}
			);
			// }
		}
	);
});

app.get("/userlist", (req, res) => {
	DBData();
	oracledb.getConnection(
		{
			user: Config_User,
			password: Config_pwd,
			connectString: Config_Con,
		},
		function (userlisterr1, connection) {
			if (userlisterr1) {
				console.error(userlisterr1);
				// res.send(err);
				return;
			}
			connection.execute(
				"select user_email,(user_fname || ' ' ||user_lname) as name,role_name,user_status from Usager_UserList inner join usager_roles on usager_roles.role_id = Usager_UserList.user_role",
				function (userlisterr2, result) {
					if (userlisterr2) {
						console.error(userlisterr2);
						// res.send(null);
						return;
					}
					// res.send(result.rows);
					let data = result.rows;
					let column = ["user_email", "user_name", "user_role", "user_status"];
					let ustr = "[";
					let index = 0;
					data.forEach((v) => {
						// console.log(v);
						ustr = ustr + "{";
						v.forEach((s) => {
							// console.log(`"id":"${s}"`);
							ustr = ustr + `"${column[index]}":"${s}"`;
							if (index !== 4) {
								ustr = ustr + ",";
							}
							index = index + 1;
						});
						ustr = ustr.slice(0, ustr.length - 1) + "},";
						index = 0;
					});
					ustr = ustr.slice(0, ustr.length - 1);
					ustr = ustr + "]";
					console.log(result.rows);
					res.send(ustr);
					connection.close(function (userlisterr3) {
						if (userlisterr3) {
							console.log(userlisterr3);
						}
					});
				}
			);
		}
	);
});

app.get("/updateuserlist", (req, res) => {
	DBData();
	oracledb.getConnection(
		{
			user: Config_User,
			password: Config_pwd,
			connectString: Config_Con,
		},
		function (updateuserlisterr1, connection) {
			if (updateuserlisterr1) {
				console.error(updateuserlisterr1);
				// res.send(err);
				return;
			}
			let updateuserlist_sql = `update Usager_userlist set user_fname=${req.query.fname}, user_lname=${req.query.lname},user_role=${req.query.role}, user_status=${req.query.status} where user_email=${req.query.email}`;
			console.log(updateuserlist_sql);
			connection.execute(
				updateuserlist_sql,
				function (updateuserlisterr2, result) {
					if (updateuserlisterr2) {
						console.error(updateuserlisterr2);
						return;
					}
					console.log(result.rowsAffected);
					res.send(result.rows);
					connection.commit();
					// connection.close(function (err) {
					// 	if (err) {
					// 		console.log(sql);
					// 		res.send(err.message);
					// 	}
					// });
				}
			);
		}
	);
});

app.get("/rolecounts", (req, res) => {
	DBData();
	oracledb.getConnection(
		{
			user: Config_User,
			password: Config_pwd,
			connectString: Config_Con,
		},
		function (rolecountserr1, connection) {
			if (rolecountserr1) {
				console.error(rolecountserr1);
				// res.send(err);
				return;
			}
			connection.execute(
				"select role_name,cast( count(user_role)as varchar(10)) as count from Usager_UserList right outer join usager_roles  on Usager_UserList.user_role = usager_roles.role_id group by role_name order by count",
				function (rolecountserr2, result) {
					if (rolecountserr2) {
						console.error(rolecountserr2);
						// res.send(null);
						return;
					}
					// res.send(result.rows);
					let data = result.rows;
					let column = ["role", "count"];
					let rstr = "[";
					let index = 0;
					data.forEach((v) => {
						// console.log(v);
						rstr = rstr + "{";
						v.forEach((s) => {
							// console.log(`"id":"${s}"`);
							// if (index === 0) {
							rstr = rstr + `"${column[index]}":"${s}"`;
							// }
							// if (index === 1) {
							// 	str = str + `"${column[index]}":${s}`;
							// }

							if (index !== 2) {
								rstr = rstr + ",";
							}
							index = index + 1;
						});
						rstr = rstr.slice(0, rstr.length - 1) + "},";
						index = 0;
					});
					rstr = rstr.slice(0, rstr.length - 1);
					rstr = rstr + "]";
					console.log(result.rows);
					res.send(rstr);
					connection.close(function (rolecountserr3) {
						if (rolecountserr3) {
							console.log(rolecountserr3);
						}
					});
				}
			);
		}
	);
});
//"jdbc:oracle:thin:@(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=obrmdidb-cname.us.dell.com)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SERVICE_NAME=obrmi_rw.dit.amer.dell.com) ) )"
app.get("/apps", (req, res) => {
	oracledb.getConnection(
		{
			user: Config_User,
			password: Config_pwd,
			connectString: Config_Con,
		},
		function (appserr1, connection) {
			if (appserr1) {
				console.error(appserr1);
				res.send(appserr1.message);
				return;
			}
			connection.execute(
				"select (app_name|| ',' ||app_id||','||role_id)as apps from usager_apps order by App_id",
				function (appserr2, result) {
					if (appserr2) {
						console.error(appserr2);
						return;
					}
					// res.send(result.rows);
					let data = result.rows;
					let column = ["AppId", "AppName", "RoleId"];
					let astr = "[";
					let index = 0;
					data.forEach((v) => {
						// console.log(v);
						astr = astr + "{";
						v.forEach((s) => {
							// console.log(`"id":"${s}"`);
							astr = astr + `"${column[index]}":"${s}"`;
							if (index !== 2) {
								astr = astr + ",";
							}
							index = index + 1;
						});
						astr = astr + "},";
						index = 0;
					});
					astr = astr.slice(0, astr.length - 1);
					astr = astr + "]";
					console.log(result.rows);
					res.send(result.rows);
					connection.close(function (appserr3) {
						if (appserr3) {
							console.log(appserr3);
						}
					});
				}
			);
		}
	);
});

app.get("/accessrequest", (req, res) => {
	DBData();
	if (req.query.email === undefined) {
		res.send("Insertion failed, Email is Empty");
		return;
	}
	oracledb.getConnection(
		{
			user: Config_User,
			password: Config_pwd,
			connectString: Config_Con,
			multipleStatements: true,
		},
		function (accessrequesterr1, connection) {
			if (accessrequesterr1) {
				console.error(accessrequesterr1);
				res.send(accessrequesterr1);
				return;
			}
			let accessrequest_sql = `Insert into USAGER_USERLIST (USER_FNAME,USER_EMAIL,USER_ROLE,USER_ORG,USER_LASTLOGIN,USER_STATUS) values ('${req.query.fname}','${req.query.email}','${req.query.role}','DELL',null,'pending')`;
			console.log(accessrequest_sql);
			connection.execute(
				accessrequest_sql,
				function (accessrequesterr2, result) {
					if (accessrequesterr2) {
						console.error(accessrequesterr2);
						return;
					}
					// console.log(result.rowsAffected);
					res.send(result.rows);
					connection.commit();
					// connection.end();
					// connection.close(function (err) {
					// 	if (err) {
					// 		console.log(err);
					// 	}
					// });
				}
			);
		}
	);
});

// app.get("/updaterole", (req, res) => {
// 	DBData();
// 	oracledb.getConnection(
// 		{
// 			user: Config_User,
// 			password: Config_pwd,
// 			connectString: Config_Con,
// 		},
// 		function (activateusererr1, connection) {
// 			if (activateusererr1) {
// 				console.error(activateusererr1);
// 				res.send(activateusererr1);
// 				return;
// 			}
// 			console.log(
// 				"Replace Role :---",
// 				`update usager_apps set Role_id = replace(role_id, '${req.query.roleid}','') where App_id in (${req.query.removeappid})`
// 			);
// 			connection.execute(
// 				`update usager_apps set Role_id = replace(role_id, '${req.query.roleid}') where App_id in (${req.query.removeappid})`,
// 				function (activateusererr2, result) {
// 					if (activateusererr2) {
// 						console.error(activateusererr2);
// 						res.send(activateusererr2);
// 						return;
// 					}
// 					console.log(result);
// 					res.send("Updated");
// 					// connection.commit();
// 					// connection.close(function (err) {
// 					// 	if (err) {
// 					// 		console.log(err);
// 					// 	}
// 					// });
// 				}
// 			);

// 			// console.log(
// 			// 	"Concat Role",
// 			// 	`update usager_apps set Role_id = concat(role_id, '-${req.query.roleid}') where App_id in (${req.query.addappid})`
// 			// );
// 			// connection.execute(
// 			// 	`update usager_apps set Role_id = concat(role_id, '-${req.query.roleid}') where App_id in (${req.query.addappid})`,
// 			// 	function (activateusererr2, result) {
// 			// 		if (activateusererr2) {
// 			// 			console.error(activateusererr2);
// 			// 			res.send(activateusererr2);
// 			// 			return;
// 			// 		}
// 			// 		console.log(result);
// 			// 		res.send("Updated");
// 			// 		connection.commit();
// 			// 		// connection.close(function (err) {
// 			// 		// 	if (err) {
// 			// 		// 		console.log(err);
// 			// 		// 	}
// 			// 		// });
// 			// 	}
// 			// );
// 		}
// 	);
// });

const PORT = process.env.PORT || 5000;
// app.set(PORT, process.env.PORT);
app.listen(PORT, () => console.log(`App listening on PORT ${PORT}`));
