const config = require("./ConfigAuth");

test("Checking User Name", () => {
	expect(config.UserName).toBe(null);
});

test("Checking PWD", () => {
	expect(config.PWD).toBe(null);
});

test("Checking Connection String", () => {
	expect(config.ConStr).toBe(null);
});

test("Checking Auth URL", () => {
	expect(config.auth_url).toBe("");
});

test("Checking Auth PWD", () => {
	expect(config.auth_pwd).toBe("");
});

test("Checking Auth UName", () => {
	expect(config.auth_uname).toBe("");
});

test("Checking VCAP Services", () => {
	const test = config.GetVCAP();
	expect(test).not.toHaveLength(0);
});

test("Checking Auth Token", () => {
	setTimeout(() => {
		const test = config.GetToken(1, 2, 3);
		expect(test).toEqual(expect.not.objectContaining(test));
	}, 2000);
});

test("Checking DB Connection", () => {
	setTimeout(() => {
		const test1 = config.GetDBCon("DIT", 21231312);
		expect(test1).toEqual(expect.not.objectContaining(test1));
	}, 2000);
});
