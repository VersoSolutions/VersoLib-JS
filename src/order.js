// Add entropy from server dev/urandom if available
if (Verso.Settings.entropy !== undefined)
    Verso.Cryptography.addPureEntropy(Verso.Settings.entropy);

/**
 * Orders used on the website
 * 
 * @param {Integer} version    Card version (e.g., 0 for silver, 1 for gold)
 * @param {String}  password   Password
 * @param {Array}   [orderKey] Key used to encrypt order data
 */
Verso.Order = function (version, password, name, orderKeyObject) {

    var cryptography = Verso.Cryptography,
        encoding = Verso.Encoding,
        bitcoin = Verso.Bitcoin,
        toBase16 = Verso.Encoding.bytesToBase16,
        toBase94 = Verso.Encoding.bytesToBase94;

    if (orderKeyObject === undefined)
        orderKeyObject = Verso.Order.newKey();

    var coldOrderKey = orderKeyObject.coldOrderKey;
    var orderKey = orderKeyObject.orderKey;
    
    var data = {};
    var card = new Verso.Card();

    var cardKey = card.getCardKey();
    var salt = card.getSalt();
    var iv = card.getIV();
    var userKey = card.getUserKey(password);
    var authID = card.getAuthID();
    var authKey = card.getAuthKey(userKey);

    var master = new Verso.Bitcoin.MasterEndpoint();

    var ep = card.deriveWallet(master).getEndpoint();
    var address = encoding.base58ToBytes(ep.getAddress());
    var encSeed = card.encryptSeed(master.getSeed(), userKey);

    var coldAddress = cryptography.aesEncrypt(address, orderKey);
    var coldCardKey = cryptography.aesEncrypt(cardKey, orderKey);

    if (version === 0) {
        var coldEncSeed = cryptography.aesEncrypt(encSeed, orderKey);

        data.version = 0;
        data.accountName = name;
        data.authID = toBase16(authID);
        data.authKey = toBase16(authKey);
        data.coldCardKey = toBase16(coldCardKey);
        data.coldAddress = toBase16(coldAddress);
        data.coldEncSeed = toBase16(coldEncSeed);

    } else if (version === 1) {
        var i;
        var shares = cryptography.secretShare(encSeed, 4, 2);
        var coldEncSeedShares = [];
        for (i = 0; i <= 2; i++) {
            coldEncSeedShares[i] = cryptography.aesEncrypt(shares[i], orderKey);
        }
        var encEncSeed4 = cryptography.aesEncrypt(shares[3], cardKey);

        shares = cryptography.secretShare(cardKey, 3, 2);
        var coldCardKeyShares = [];
        for (i = 0; i <= 2; i++) {
            coldCardKeyShares[i] = cryptography.aesEncrypt(shares[i], orderKey);
        }

        var recoverySalt = cryptography.randomBytes(32);
        var recoveryKey = cryptography.PBKDF2(password, recoverySalt, 1000);

        shares = cryptography.secretShare(recoveryKey, 3, 2);
        var coldRecoveryKeyShares = [];
        for (i = 0; i <= 2; i++) {
            coldRecoveryKeyShares[i] = cryptography.aesEncrypt(shares[i], orderKey);
        }

        data.version = 1;
        data.accountName = name;
        data.authID = toBase16(authID);
        data.authKey = toBase16(authKey);
        data.coldCardKey = toBase16(coldCardKey);
        data.coldAddress = toBase16(coldAddress);
        data.coldEncSeed1 = toBase16(coldEncSeedShares[0]);
        data.coldEncSeed2 = toBase16(coldEncSeedShares[1]);
        data.coldEncSeed3 = toBase16(coldEncSeedShares[2]);
        data.encEncSeed4 = toBase16(encEncSeed4);
        data.coldCardKey1 = toBase16(coldCardKeyShares[0]);
        data.coldCardKey2 = toBase16(coldCardKeyShares[1]);
        data.coldCardKey3 = toBase16(coldCardKeyShares[2]);
        data.recoverySalt = toBase16(recoverySalt);
        data.coldRecoveryKey1 = toBase16(coldRecoveryKeyShares[0]);
        data.coldRecoveryKey2 = toBase16(coldRecoveryKeyShares[1]);
        data.coldRecoveryKey3 = toBase16(coldRecoveryKeyShares[2]);
    } else throw new Verso.Error("Invalid card version!");

    return data;
};

Verso.Order.newKey = function () {
    var orderKey = Verso.Cryptography.randomBytes(32, 6);
    var coldOrderKey = Verso.Cryptography.rsaEncrypt(orderKey, Verso.Settings.rsaKey.modulus, Verso.Settings.rsaKey.exponent);

    return {
        orderKey: orderKey,
        coldOrderKey: Verso.Encoding.bytesToBase16(coldOrderKey)
    };
};