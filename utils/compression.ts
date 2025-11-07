const keyStrUriSafe = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$";
const baseReverseDic: Record<string, Record<string, number>> = {};

function getBaseValue(alphabet: string, character: string): number {
    if (!baseReverseDic[alphabet]) {
        baseReverseDic[alphabet] = {};
        for (let i = 0; i < alphabet.length; i++) {
            baseReverseDic[alphabet][alphabet.charAt(i)] = i;
        }
    }
    const value = baseReverseDic[alphabet][character];
    if (value === undefined) {
        throw new Error(`Invalid character "${character}" in compressed string.`);
    }
    return value;
}

function _compress(uncompressed: string, bitsPerChar: number, getCharFromInt: (value: number) => string): string {
    if (uncompressed == null) {
        return '';
    }

    let i: number;
    const dictionary: Record<string, number> = {};
    const dictionaryToCreate: Record<string, boolean> = {};
    let c = '';
    let wc = '';
    let w = '';
    let enlargeIn = 2;
    let dictSize = 3;
    let numBits = 2;
    const data: string[] = [];
    let dataVal = 0;
    let dataPosition = 0;

    for (let ii = 0; ii < uncompressed.length; ii += 1) {
        c = uncompressed.charAt(ii);
        if (!Object.prototype.hasOwnProperty.call(dictionary, c)) {
            dictionary[c] = dictSize++;
            dictionaryToCreate[c] = true;
        }
        wc = w + c;
        if (Object.prototype.hasOwnProperty.call(dictionary, wc)) {
            w = wc;
        } else {
            if (Object.prototype.hasOwnProperty.call(dictionaryToCreate, w)) {
                if (w.charCodeAt(0) < 256) {
                    for (i = 0; i < numBits; i++) {
                        dataVal = (dataVal << 1);
                        if (dataPosition === bitsPerChar - 1) {
                            dataPosition = 0;
                            data.push(getCharFromInt(dataVal));
                            dataVal = 0;
                        } else {
                            dataPosition++;
                        }
                    }
                    const value = w.charCodeAt(0);
                    for (i = 0; i < 8; i++) {
                        dataVal = (dataVal << 1) | (value >> (7 - i) & 1);
                        if (dataPosition === bitsPerChar - 1) {
                            dataPosition = 0;
                            data.push(getCharFromInt(dataVal));
                            dataVal = 0;
                        } else {
                            dataPosition++;
                        }
                    }
                } else {
                    let value = 1;
                    for (i = 0; i < numBits; i++) {
                        dataVal = (dataVal << 1) | value;
                        if (dataPosition === bitsPerChar - 1) {
                            dataPosition = 0;
                            data.push(getCharFromInt(dataVal));
                            dataVal = 0;
                        } else {
                            dataPosition++;
                        }
                        value = 0;
                    }
                    value = w.charCodeAt(0);
                    for (i = 0; i < 16; i++) {
                        dataVal = (dataVal << 1) | (value >> (15 - i) & 1);
                        if (dataPosition === bitsPerChar - 1) {
                            dataPosition = 0;
                            data.push(getCharFromInt(dataVal));
                            dataVal = 0;
                        } else {
                            dataPosition++;
                        }
                    }
                }
                enlargeIn--;
                if (enlargeIn === 0) {
                    enlargeIn = Math.pow(2, numBits);
                    numBits++;
                }
                delete dictionaryToCreate[w];
            } else {
                const value = dictionary[w];
                for (i = 0; i < numBits; i++) {
                    dataVal = (dataVal << 1) | (value >> (numBits - 1 - i) & 1);
                    if (dataPosition === bitsPerChar - 1) {
                        dataPosition = 0;
                        data.push(getCharFromInt(dataVal));
                        dataVal = 0;
                    } else {
                        dataPosition++;
                    }
                }
            }

            enlargeIn--;
            if (enlargeIn === 0) {
                enlargeIn = Math.pow(2, numBits);
                numBits++;
            }

            dictionary[wc] = dictSize++;
            w = String(c);
        }
    }

    if (w !== '') {
        if (Object.prototype.hasOwnProperty.call(dictionaryToCreate, w)) {
            if (w.charCodeAt(0) < 256) {
                for (i = 0; i < numBits; i++) {
                    dataVal = (dataVal << 1);
                    if (dataPosition === bitsPerChar - 1) {
                        dataPosition = 0;
                        data.push(getCharFromInt(dataVal));
                        dataVal = 0;
                    } else {
                        dataPosition++;
                    }
                }
                const value = w.charCodeAt(0);
                for (i = 0; i < 8; i++) {
                    dataVal = (dataVal << 1) | (value >> (7 - i) & 1);
                    if (dataPosition === bitsPerChar - 1) {
                        dataPosition = 0;
                        data.push(getCharFromInt(dataVal));
                        dataVal = 0;
                    } else {
                        dataPosition++;
                    }
                }
            } else {
                let value = 1;
                for (i = 0; i < numBits; i++) {
                    dataVal = (dataVal << 1) | value;
                    if (dataPosition === bitsPerChar - 1) {
                        dataPosition = 0;
                        data.push(getCharFromInt(dataVal));
                        dataVal = 0;
                    } else {
                        dataPosition++;
                    }
                    value = 0;
                }
                value = w.charCodeAt(0);
                for (i = 0; i < 16; i++) {
                    dataVal = (dataVal << 1) | (value >> (15 - i) & 1);
                    if (dataPosition === bitsPerChar - 1) {
                        dataPosition = 0;
                        data.push(getCharFromInt(dataVal));
                        dataVal = 0;
                    } else {
                        dataPosition++;
                    }
                }
            }
            enlargeIn--;
            if (enlargeIn === 0) {
                enlargeIn = Math.pow(2, numBits);
                numBits++;
            }
            delete dictionaryToCreate[w];
        } else {
            const value = dictionary[w];
            for (i = 0; i < numBits; i++) {
                dataVal = (dataVal << 1) | (value >> (numBits - 1 - i) & 1);
                if (dataPosition === bitsPerChar - 1) {
                    dataPosition = 0;
                    data.push(getCharFromInt(dataVal));
                    dataVal = 0;
                } else {
                    dataPosition++;
                }
            }
        }

        enlargeIn--;
        if (enlargeIn === 0) {
            enlargeIn = Math.pow(2, numBits);
            numBits++;
        }
    }

    const value = 2;
    for (i = 0; i < numBits; i++) {
        dataVal = (dataVal << 1) | (value >> (numBits - 1 - i) & 1);
        if (dataPosition === bitsPerChar - 1) {
            dataPosition = 0;
            data.push(getCharFromInt(dataVal));
            dataVal = 0;
        } else {
            dataPosition++;
        }
    }

    while (true) {
        dataVal = (dataVal << 1);
        if (dataPosition === bitsPerChar - 1) {
            data.push(getCharFromInt(dataVal));
            break;
        }
        dataPosition++;
    }

    return data.join('');
}

function _decompress(length: number, resetValue: number, getNextValue: (index: number) => number): string {
    const dictionary: Record<number, string> = {};
    let next: number;
    let enlargeIn = 4;
    let dictSize = 4;
    let numBits = 3;
    let entry = '';
    const result: string[] = [];
    let i: number;
    let w: string;
    let bits: number;
    let resb: number;
    let maxpower: number;
    let power: number;

    let dataVal = getNextValue(0);
    let dataPosition = resetValue;
    let dataIndex = 1;

    const data = {
        val: dataVal,
        position: resetValue,
        index: dataIndex
    };

    for (i = 0; i < 3; i += 1) {
        dictionary[i] = i.toString();
    }

    bits = 0;
    maxpower = Math.pow(2, 2);
    power = 1;
    while (power !== maxpower) {
        resb = data.val & data.position;
        data.position >>= 1;
        if (data.position === 0) {
            data.position = resetValue;
            data.val = getNextValue(data.index++);
        }
        bits |= (resb > 0 ? 1 : 0) * power;
        power <<= 1;
    }

    switch (next = bits) {
        case 0:
            bits = 0;
            maxpower = Math.pow(2, 8);
            power = 1;
            while (power !== maxpower) {
                resb = data.val & data.position;
                data.position >>= 1;
                if (data.position === 0) {
                    data.position = resetValue;
                    data.val = getNextValue(data.index++);
                }
                bits |= (resb > 0 ? 1 : 0) * power;
                power <<= 1;
            }
            next = bits;
            break;
        case 1:
            bits = 0;
            maxpower = Math.pow(2, 16);
            power = 1;
            while (power !== maxpower) {
                resb = data.val & data.position;
                data.position >>= 1;
                if (data.position === 0) {
                    data.position = resetValue;
                    data.val = getNextValue(data.index++);
                }
                bits |= (resb > 0 ? 1 : 0) * power;
                power <<= 1;
            }
            next = bits;
            break;
        case 2:
            return '';
    }

    dictionary[3] = String.fromCharCode(next);
    w = dictionary[3];
    result.push(w);

    while (true) {
        if (data.index > length) {
            return result.join('');
        }

        bits = 0;
        maxpower = Math.pow(2, numBits);
        power = 1;
        while (power !== maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position === 0) {
                data.position = resetValue;
                data.val = getNextValue(data.index++);
            }
            bits |= (resb > 0 ? 1 : 0) * power;
            power <<= 1;
        }

        switch (next = bits) {
            case 0:
                bits = 0;
                maxpower = Math.pow(2, 8);
                power = 1;
                while (power !== maxpower) {
                    resb = data.val & data.position;
                    data.position >>= 1;
                    if (data.position === 0) {
                        data.position = resetValue;
                        data.val = getNextValue(data.index++);
                    }
                    bits |= (resb > 0 ? 1 : 0) * power;
                    power <<= 1;
                }
                dictionary[dictSize++] = String.fromCharCode(bits);
                next = dictSize - 1;
                enlargeIn--;
                break;
            case 1:
                bits = 0;
                maxpower = Math.pow(2, 16);
                power = 1;
                while (power !== maxpower) {
                    resb = data.val & data.position;
                    data.position >>= 1;
                    if (data.position === 0) {
                        data.position = resetValue;
                        data.val = getNextValue(data.index++);
                    }
                    bits |= (resb > 0 ? 1 : 0) * power;
                    power <<= 1;
                }
                dictionary[dictSize++] = String.fromCharCode(bits);
                next = dictSize - 1;
                enlargeIn--;
                break;
            case 2:
                return result.join('');
        }

        if (enlargeIn === 0) {
            enlargeIn = Math.pow(2, numBits);
            numBits++;
        }

        if (dictionary[next]) {
            entry = dictionary[next];
        } else {
            if (next === dictSize) {
                entry = w + w.charAt(0);
            } else {
                return '';
            }
        }
        result.push(entry);

        dictionary[dictSize++] = w + entry.charAt(0);
        enlargeIn--;
        w = entry;

        if (enlargeIn === 0) {
            enlargeIn = Math.pow(2, numBits);
            numBits++;
        }
    }
}

export function compressToEncodedURIComponent(input: string): string {
    if (input == null) {
        return '';
    }
    return _compress(input, 6, (a) => keyStrUriSafe.charAt(a));
}

export function decompressFromEncodedURIComponent(input: string): string {
    if (input == null || input === '') {
        return '';
    }
    return _decompress(input.length, 32, (index) => getBaseValue(keyStrUriSafe, input.charAt(index)));
}
