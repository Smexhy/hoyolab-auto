const parse = (cookie) => {
	if (typeof cookie !== "string") {
		return {};
	}

	const result = {};
	for (const rawPair of cookie.split(";")) {
		const pair = rawPair.trim();
		const separatorIndex = pair.indexOf("=");
		if (separatorIndex <= 0) {
			continue;
		}

		const key = pair.slice(0, separatorIndex).trim();
		const value = pair.slice(separatorIndex + 1).trim();
		if (key) {
			result[key] = value;
		}
	}

	return result;
};

const serialize = (cookie, options = {}) => {
	const { whitelist = [], blacklist = [], separator = ";" } = options;
	const cookieMap = typeof cookie === "string" ? parse(cookie) : cookie;

	return Object.entries(cookieMap)
		.filter(([key, value]) => {
			if (typeof value === "undefined" || value === null) {
				return false;
			}
			if (whitelist.length > 0 && !whitelist.includes(key)) {
				return false;
			}
			return !blacklist.includes(key);
		})
		.map(([key, value]) => `${key}=${value}`)
		.join(`${separator} `);
};

const merge = (cookie, values, options = {}) => serialize({
	...parse(cookie),
	...values
}, options);

module.exports = {
	merge,
	parse,
	serialize
};
