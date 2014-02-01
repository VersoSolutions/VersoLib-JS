var Cryptography = Verso.Cryptography;
var Encoding = Verso.Encoding;

Cryptography.addPureEntropy(Cryptography.SHA256([0]));

asyncTest("Verso: Silver", function(assert) {
    expect(5);

    // Test parameters
    // [6,33,189,98,43,22,64,244,176,174,156,152,82,252,234,230,158,85,71,194,220,117,192,21,180,210,154,232,32,47,163,94]
    var encPriv = "! (KL}k2f4i8;oKy46iM^O 2u|Wj$x*ubD5]]QSi)m`~qBCA5)m):K.Zg4OLg| %m*BL\"bxMv0=]Z(1rMqaVcbNW"; // without escaping: ! (KL}k2f4i8;oKy46iM^O 2u|Wj$x*ubD5]]QSi)m`~qBCA5)m):K.Zg4OLg| %m*BL"bxMv0=]Z(1rMqaVcbNW
    var password = "silver";
    var version = 0;
    var cardKey = [173,4,126,5,215,167,120,107,154,102,39,14,10,200,250,244];
    var authID = [50,203,50,8,152,86,148,185,49,205,56,223,160,195,88,80];
    var authKey = [];
    var seed = [151,112,229,103,212,186,212,110,34,159,243,229,164,181,193,192,176,233,81,171,63,21,239,215,251,221,23,176,44,47,22,221];
    var address = "1JPwiBRqu35zmkZdVyWHNKL2CJX6PhwSjE";

    var c = Verso.Card.parsePrivate(encPriv);
    assert.equal(c.getVersion(), version, "Decode private: version");
    assert.deepEqual(c.getCardKey(), cardKey, "Decode private: cardKey");
    assert.deepEqual(c.getAuthID(), authID, "Process private: authID");
    
    c.getEndpoints(password, false, function (eps) {
        assert.equal(eps[0].getAddress(), address, "Decrypt private: m/0 Address");
        assert.deepEqual(eps[0].getPrivate(), new Verso.Bitcoin.MasterEndpoint(seed).getChild().getPrivate(), "Decrypt private: m/0 private key");
        start();
    }, function (message) {
        start();
        throw new Error(message);
    });
});

asyncTest("Verso: Gold", function (assert) {
    expect(5);

    // Test parameters
    var encPriv = "\" *e{$T:<k2#cfsDX\">CB5 &13~:B2?E>Y$8tz:GW.=NbGWBq/FRnKd4X7SRDuTI &{I]DuC6b:\":|jvp;R1KF^p@7"; // without escaping: " *e{$T:<k2#cfsDX">CB5 &13~:B2?E>Y$8tz:GW.=NbGWBq/FRnKd4X7SRDuTI &{I]DuC6b:":|jvp;R1KF^p@7
    var password = "gold";
    var secret3 = [4,196,239,249,63,54,35,255,166,24,4,186,54,47,62,57,122,11,218,215,108,151,25,45,170,248,6,76,221,204,242,230,42,194];
    var version = 1;
    var cardKey = [225,255,69,138,221,128,156,72,17,17,126,255,82,18,67,66];
    var authID = [208,154,126,77,55,100,144,159,175,30,68,138,63,91,166,31];
    var authKey = [];
    var seed = [221,184,115,123,8,110,101,74,122,157,185,1,252,81,145,45,246,243,192,129,47,140,241,201,165,207,60,57,163,7,185,229];
    var address = "1NZi4TkMCrdicyhyd4egrn6mwS7xRCgLiK";

    var c = Verso.Card.parsePrivate(encPriv);
    assert.equal(c.getVersion(), version, "Decode private: version");
    assert.deepEqual(c.getCardKey(), cardKey, "Decode private: cardKey");
    assert.deepEqual(c.getAuthID(), authID, "Process private: authID");

    var encEncSeedShare = Verso.Cryptography.aesEncrypt(secret3, cardKey);

    c.getEndpoints(password, false, function (eps) {
        assert.equal(eps[0].getAddress(), address, "Decrypt private: m/0 Address");
        assert.deepEqual(eps[0].getPrivate(), new Verso.Bitcoin.MasterEndpoint(seed).getChild().getPrivate(), "Decrypt private: m/0 private key");
        start();
    }, function (message) {
        start();
        throw new Error(message);
    }); //encEncSeedShare);
});

test("Order", function (assert) {
    expect(3);

    assert.ok(new Verso.Order(0, "silver"), "Creation: Silver");
    assert.ok(new Verso.Order(1, "gold"), "Creation: Gold");
    assert.ok(new Verso.Order(0, Verso.Order.newKey()), "Creation: Pre-defined key");
});