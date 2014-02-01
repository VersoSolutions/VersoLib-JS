/**
 * The generic Verso Card providing basic properties unrelated to the wallet
 *
 * @constructor
 * @param {Array}  [cardKey] Key of the card, randomly generated if undefined
 */
Verso.Card = function (cardKey) {
    var encoding = Verso.Encoding,
        cryptography = Verso.Cryptography,
        bitcoin = Verso.Bitcoin;

    if (cardKey === undefined)
        cardKey = cryptography.randomBytes(16); // Create new card

    var authID = cryptography.SHASHASHA256(cardKey).slice(0, 16);

    /** Returns the card's cardKey */
    this.getCardKey = function () { return cardKey; };
    /** Returns the card's authID */
    this.getAuthID = function () { return authID; }; // AuthID is used to authentify the card on the Verso server
    /** Returns the salt used in PBKDF2 */
    this.getSalt = function () { return cryptography.SHA256(cardKey); }; // Salt is used as an input of the key derivation function
    /** Returns the IV used in AES */
    this.getIV = function () { return cryptography.SHASHA256(cardKey).slice(0, 16); }; // IV is used as an input of the AES encryptor
    /** Returns the user key used to decrypt encSeed */
    this.getUserKey = function (password) { return cryptography.PBKDF2(password, this.getSalt(), 500); }; // UserKey is used to encrypt/decrypt the bitcoin private key
    /** Returns the auth key used to authentify the card on the web server, where data is either the password or the userKey */
    this.getAuthKey = function (data) { // AuthKey is used to authentify the user on the Verso Server
        if (!Array.isArray(data))
            data = this.getUserKey(data);

        return cryptography.SHA256(data).slice(0, 16);
    };
};

/** Returns the encrypted seed, where key is either the password or the userKey
 *
 * @param {Array}  seed   Seed to be encrypted
 * @param {Array}  [key]  Key or password used to encrypt the seed
 * @return Encrypted seed
 */
Verso.Card.prototype.encryptSeed = function (seed, key) {
    var cryptography = Verso.Cryptography;

    if (!Array.isArray(key))
        key = this.getUserKey(key);

    return cryptography.aesEncrypt(seed, key, this.getIV());
};

/** Returns the wallet derived from a seed or a master endpoint
 *
 * @param {Array|MasterEndpoint}  data   Seed or MasterEndpoint from which wallet is derived
 * @return Wallet associated to the card
*/
Verso.Card.prototype.deriveWallet = function (data) {
    var bitcoin = Verso.Bitcoin;

    if (Array.isArray(data))
        return new bitcoin.Wallet(new bitcoin.MasterEndpoint(data).getChild());
    else if (data instanceof bitcoin.ExtendedEndpoint && data.isMaster())
        return new bitcoin.Wallet(data.getChild());

    throw new Verso.Error("Invalid argument!");
};

/**
 * The Verso Silver corresponding to the data in a private QR code.
 *
 * @constructor
 * @param {Array}  cardKey   Key of the card
 * @param {Array}  encSeed   Encrypted seed of the card
 * @param {Array}  pubHash   Public key has of the card
 */
Verso.SilverCard = function (cardKey, encSeed, pubHash) {
    Verso.Card.call(this, cardKey);

    var endpoint = new Verso.Bitcoin.Endpoint(pubHash);

    /** Returns the card's version */
    this.getVersion = function () { return 0; };
    /** Returns the encrypted seed of the card */
    this.getEncSeed = function () { return encSeed; };
    /** Returns the public hash of the card */
    this.getPublicHash = function() { return pubHash; };
    /** Returns the endpoints of the card */
    this.getEndpoints = function (password, all, onResult, onError) { // TODO: implement "all" with determinism
        var cryptography = Verso.Cryptography;

        if(password) {
            var seed = cryptography.aesDecrypt(this.getEncSeed(), this.getUserKey(password), this.getIV());

            try {
                var ep = new Verso.Bitcoin.MasterEndpoint(seed).getChild();

                if (ep.sameAs(this.getPublicHash())) {
                    onResult([ep]);
                }
                else {
                    onError(new Verso.CredentialsError("Invalid password!"));
                }
            } catch (e) {
                onError(new Verso.Error(e.toString()));
            }
        }
        else {
            onResult([endpoint]);
        }
    };
};

Verso.SilverCard.prototype = Verso.Class.inherit(Verso.Card.prototype);

/**
 * Serialize card
 *
 * @return Serialized card with private side format
 */
Verso.SilverCard.prototype.serialize = function () {
    var encoding = Verso.Encoding;

    return encoding.bytesToBase94(this.getVersion()) + " " + encoding.bytesToBase94(this.getCardKey()) + " " + encoding.bytesToBase94(this.getEncSeed()) + " " + encoding.bytesToBase94(this.getPublicHash());
};

/**
 * The Verso Gold corresponding to the data in a private QR code.
 *
 * @constructor
 * @param {Array}  cardKey   Key of the card
 * @param {Array}  encSeed1  Encrypted seed share of the card
 * @param {Array}  pubHash   Public key has of the card
 */
Verso.GoldCard = function (cardKey, encSeed1, pubHash) {
    Verso.Card.call(this, cardKey);

    var cryphography = Verso.Cryptography,
        bitcoin = Verso.Bitcoin;

    var endpoint = new bitcoin.Endpoint(pubHash);

    /** Returns the card's version */
    this.getVersion = function () { return 1; };
    /** Returns the encrypted seed share of the card */
    this.getEncSeed1 = function () { return encSeed1; };
    /** Returns the public hash of the card */
    this.getPublicHash = function () { return pubHash; };
    /** Returns the endpoints of the card */
    this.getEndpoints = function (password, all, onResult, onError, encEncSeedShare) { // TODO: implement "all" with determinism
        var cryptography = Verso.Cryptography,
            encoding = Verso.Encoding;
        var that = this;

        if (password) {
            var userKey = that.getUserKey(password);

            var onSeedShare = function (encEncSeedShare) {
                var encSeedShare = cryptography.aesDecrypt(encEncSeedShare, that.getCardKey());
                var encSeed = cryptography.secretCombine([that.getEncSeed1(), encSeedShare]);
                var seed = cryptography.aesDecrypt(encSeed, userKey, that.getIV());

                try {
                    var ep = new Verso.Bitcoin.MasterEndpoint(seed).getChild();

                    if (ep.sameAs(that.getPublicHash())) {
                        onResult([ep]);
                    }
                    else {
                        onError(new Verso.CredentialsError("Invalid password!"));
                    }
                } catch (e) {
                    onError(new Verso.Error(e.toString()));
                }
            };

            if (encEncSeedShare) {
                onSeedShare(encEncSeedShare);
            } else {
                Verso.Services.seedShare(that.getAuthID(), that.getAuthKey(userKey), onSeedShare, onError);
            }
        } else {
            onResult([endpoint]);
        }
    };
};

Verso.GoldCard.prototype = Verso.Class.inherit(Verso.Card.prototype);

/**
 * Serialize card
 *
 * @return Serialized card with private side format
 */
Verso.GoldCard.prototype.serialize = function () {
    var encoding = Verso.Encoding;

    return encoding.bytesToBase94(this.getVersion()) + " " + encoding.bytesToBase94(this.getCardKey()) + " " + encoding.bytesToBase94(this.getEncSeed1()) + " " + encoding.bytesToBase94(this.getPublicHash());
};

/** Returns the watch-only endpoint corresponding to the card public or private side data */
Verso.Card.parsePublic = function (data) {
    var encoding = Verso.Encoding;

    if (!data) return false;

    var pub = new RegExp("^(?:bitcoin:)?(1[a-zA-Z0-9]+)(?:\\?[a-zA-Z]+=[^&=]+(&[a-zA-Z]+=[^&=]+)*)?$");

    if (pub.test(data)) {
        try {
            return new Verso.Bitcoin.Endpoint(pub.exec(data)[1]);
        } catch (e) {
            return false;
        }
    }

    try {
        var items = data.split(" ").map(function (item) { return encoding.base94ToBytes(item); });

        var version = items[0][0];

        if (version === 0 || version === 1)
            return new Verso.Bitcoin.Endpoint(items[3]);
    }
    catch (e) {}

    return false;
};

/** Returns the Card corresponding to the card private side data
 *
 * @param {String}  data   Content of the QR code
 * @return Card corresponding to the private QR code
*/
Verso.Card.parsePrivate = function (data) {
    var encoding = Verso.Encoding;

    if (!data)
        return false;

    try {
        var items = data.split(" ").map(function (item) { return encoding.base94ToBytes(item); });

        var version = items[0][0];
        var cardKey = items[1];
        var tmp = items.slice(2);

        if (version === 0)
            return new Verso.SilverCard(cardKey, tmp[0], tmp[1]);
        else if (version === 1)
            return new Verso.GoldCard(cardKey, tmp[0], tmp[1]);
    }
    catch (e) { }

    return false;
};