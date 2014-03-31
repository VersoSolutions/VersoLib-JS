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
    modulus: "87784cf8f6feb6c9d78c7a81b58f34c0e83d39b9170c7bd0fd12de7c6ea69dfa783fb7fef5752b444ac407427b584eb6ae52b58785013d8d59d3704da6e5d9780e665e63254c04c7aa92cdbc31fbfe56255e9b21738a96bab016c05ed3b4dcf4bd4d16c87b9106b9dfaa04c258107621ac8c15b9e01cc273f13549d701d91d2f7150c1320f14cfe597bd8f8cf740e68e40861ad36fdb9d1688a7edfe90b50f38439df14ed264ed2318e05597cb3d246fd117a8fbe7ab39ab46fdc9a4fa95c4c260b8fd8649239a7f49944b1dd7305c3587df069a187c794faaa448e371348c3d520ef0d619e7af7d4bce79c0be65135d37ca06bd1d118567f1ba0ee54a94e3a5",
    exponent: "010001"
};