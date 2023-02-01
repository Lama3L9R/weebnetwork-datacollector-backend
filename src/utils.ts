import crypto from 'crypto'

export function sha512(data: any): string {
    return crypto.createHash("sha512").update(data).digest("hex")
}

export function genToken(key?: any) {
    return sha512(key + "love lama" + Math.random() + "<3" + Date.now()) 
}