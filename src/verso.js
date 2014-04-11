/**
 * Wrapper for services of versocards.com
 */
Verso.Services = (function () {
    var encoding = Verso.Encoding;

    /**
     * Get card information associated to an authID
     *
     * @param  {ByteArray}  authID   The card authID
     * @param  {Function}   onInfos  Function called when the card name is received
     * @param  {Function}   onError  Function called in case of error
     */
    var cardDetails = function (authID, onInfos, onError) {
        $.ajax({
            type: "POST",
            url: "https://versocards.com/api/cardDetails/",
            data: {
                "authID": encoding.bytesToBase16(authID)
            },
            success: function (res) {
                res = JSON.parse(res);

                if (!res.error) {
                    onInfos({ name: res.name });
                }
                else if (onError) {
                    onError(new Verso.CredentialsError("Invalid credentials!"));
                }
            },
            error: function (xhr, opt, err) {
                if (onError)
                    onError(new Verso.ConnectionError("Connection problem!"));
            }
        });
    };

    /**
     * Get the indices of the deterministic addresses associated to an authID (e.g. k for m/k such as in BIP0032)
     *
     * @param  {ByteArray}  authID   The card authID
     * @param  {Function}   onInfos  Function called when the card name is received
     * @param  {Function}   onError  Function called in case of error
     */
    var indices = function (authID, onIndices, onError) {
        // TODO: Finish this.
        onIndices([]);
        return;

        // jQuery.ajax({
        //     type: "POST",
        //     url: "https://versocards.com/api/indices/",
        //     data: {
        //         "authID": encoding.bytesToBase16(authID)
        //     },
        //     success: function (res) {
        //         res = JSON.parse(res);

        //         if (!res.error) {
        //             var indices = [];

        //             for (var i = 0; i < res.indices; i++) {
        //                 indices.push(parseInt(res.onIndices[i]));
        //             }
        //             onIndices({ name: res.name });
        //         }
        //         else if (onError) {
        //             onError(new Verso.CredentialsError("Invalid credentials!"));
        //         }
        //     },
        //     error: function (xhr, opt, err) {
        //         if (onError)
        //             onError(new Verso.ConnectionError("Connection problem!"));
        //     }
        // });
    };

    /**
     * Get the encrypted seed share associated to a Gold Card
     *
     * @param  {ByteArray}  authID   The card authID
     * @param  {ByteArray}  authKey  The user authKey
     * @param  {Function}   onShare  Function called when the share is received
     * @param  {Function}   onError  Function called in case of error
     */
    var seedShare = function (authID, authKey, onShare, onError) {
        $.ajax({
            type: "POST",
            url: "https://versocards.com/api/seedShare/",
            data: {
                "authID": encoding.bytesToBase16(authID),
                "authKey": encoding.bytesToBase16(authKey)
            },
            success: function (res) {
                res = JSON.parse(res);

                if (res.seed !== undefined && res.seed != "false") {
                    onShare(encoding.base16ToBytes(res.seed));
                }
                else if (onError) {
                    onError(new Verso.CredentialsError("Invalid credentials!"));
                }
            },
            error: function (xhr, opt, err) {
                if (onError)
                    onError(new Verso.ConnectionError("Connection problem!"));
            }
        });
    };

    /**
     * Get some entropy from server /dev/urandom
     *
     * @param  {ByteArray}  authID     The card authID
     * @param  {Integer}    n          The number of desired bytes
     * @param  {Function}   onEntropy  Function called when the entropy is received
     * @param  {Function}   [onError]  Function called in case of error
     */
    var entropy = function (authID, n, onEntropy, onError) {
        $.ajax({
            type: "POST",
            url: "https://versocards.com/api/entropy/",
            data: {
                "authID": encoding.bytesToBase16(authID),
                "nBytes": n
            },
            success: function (res) {
                res = JSON.parse(res);

                if (res.entropy !== undefined && res.seed != "false") {
                    onEntropy(encoding.base16ToBytes(res.entropy));
                }
                else if (onError) {
                    onError(new Verso.CredentialsError("Invalid credentials!"));
                }
            },
            error: function (xhr, opt, err) {
                if (onError)
                    onError(new Verso.ConnectionError("Connection problem!"));
            }
        });
    };

    return {
        cardDetails: cardDetails,
        seedShare: seedShare,
        entropy: entropy
    };
})();

Verso.Settings.rsaKey = {
    modulus: "b5282cccc86e413ac71fb8f8e155914afa92dca3f514ea792396fc963adcfc1a49fe8e271d455ab05d08083454ec691d2716e622738fa12e58503a7ed1b7e566963d76e2b78c4eb2e95cec25b63527461395e41be04d71360fd379b756470423763ae93a895746cd0cb407ce5068f1e655a6a520e1c2cb348daeb5ee7a274f5af0f9ff6d3549f279252d8a566631c965d2cc585a79292989c955b47353372a51e7d5630a3f5643ce284819384ad8c0d6d7c39f2e2875a19a7d0ab000516ffa2c99376a86c1d83f68b15d68f8acf1c4bf3fda71b40fb13d922f6369474c5179962377451618f5eddd020f237d6931c8b36b4ef77b6e938aed88b28262bb23f59f",
    exponent: "010001"
};