import { FastifyInstance } from "fastify";
import { prisma } from "..";
import { genToken, sha512 } from "../utils";

export function registerAll(fastify: FastifyInstance) {
    login(fastify)
}

export const tokens = new Map()

export const login = (fastify: FastifyInstance) => {
    fastify.route({
        method: "POST",
        url: "/login",
        schema: {
            body: {
                "$schema": "http://json-schema.org/draft-04/schema#",
                "type": "object",
                "properties": {
                  "email": {
                      "type": "string"
                  },
                  "password": {
                      "type": "string"
                  }
                },
                "required": [
                  "email",
                  "password"
                ]
              },
            response: {
                "$schema": "http://json-schema.org/draft-04/schema#",
                "type": "object",
                "properties": {
                  "rep": {
                    "type": "object",
                    "properties": {
                      "ret": {
                        "type": "integer"
                      },
                      "msg": {
                        "type": "string"
                      }
                    },
                  },
                  "payload": {
                    "type": "object",
                    "properties": {
                      "token": {
                        "type": "string"
                      },
                      "displayName": {
                        "type": "string"
                      },
                      "contributions": {
                        "type": "number"
                      },
                      "role": {
                        "type": "string"
                      },
                      "uid": {
                        "type": "string"
                      }
                    },
                  }
                },
                "required": [
                  "rep",
                ]
              }
        },
        handler: async function(req, rep) {
            const { email, password } = JSON.parse(req.body as string)
            if (!email || !password) {
                return await rep.send({
                    rep: {
                        ret: -1,
                        msg: "Email or password code can't be null"
                    }
                })
            }

            try {
                const user = await prisma.user.findFirstOrThrow({
                    where: {
                        email,
                        password: sha512(password)
                    },
                    select: {
                        email: true,
                        uid: true,
                        displayName: true,
                        contributions: true,
                        role: true
                    }
                })
                
                const token = genToken(user.email);
                tokens.set(token, user.uid);

                rep.send({
                    rep: {
                        ret: 0,
                        msg: ""
                    },
                    payload: { token, ...user }
                })
                this.log.info(`login user ${email} with password ${password} successfully, token: ${token}`)
            } catch (err) {
                this.log.info(`login user ${email} with password ${password} failed`)
                rep.send({
                    rep: {
                        ret: -2,
                        msg: "Username or password mismatch"
                    }
                })
            }
            
        }
    })
}

export const register = (fastify: FastifyInstance) => {
    fastify.route({
        method: "POST",
        url: "/register",
        schema: {
            body: {
                "$schema": "http://json-schema.org/draft-04/schema#",
                "type": "object",
                "properties": {
                  "email": {
                    "type": "string"
                  },
                  "password": {
                    "type": "string"
                  },
                  "invitation": {
                    "type": "string"
                  },
                  "displayName": {
                    "type": "string"
                  }
                },
                "required": [
                  "email",
                  "password",
                  "displayName",
                  "invitation"
                ]
              },
            response: {
                "$schema": "http://json-schema.org/draft-04/schema#",
                "type": "object",
                "properties": {
                  "rep": {
                    "type": "object",
                    "properties": {
                      "ret": {
                        "type": "integer"
                      },
                      "msg": {
                        "type": "string"
                      }
                    },
                  }
                },
                "required": [
                  "rep",
                ]
              }
        },
        handler: async function(req, rep) {
            const { email, password, displayName, invitation } = JSON.parse(req.body as string)

            if (!email || !password || !invitation) {
                return await rep.send({
                    rep: {
                        ret: -1,
                        msg: "Email, password or invitation code can't be null"
                    }
                })
            }

            if (await prisma.user.count({ where: { email } }) > 0) {
                return await rep.send({
                    rep: {
                        ret: -2,
                        msg: "You've already registered! If you dont remeber your password please contact admin"
                    }
                })
            }

            if (await prisma.invitation.count({ where: { id: invitation } }) === 0) {
                return await rep.send({
                    rep: {
                        ret: -3,
                        msg: "Invaild invitation code"
                    }
                })
            }

            await prisma.user.create({
                data: {
                    email, 
                    password: sha512(password),
                    displayName,
                    invitationId: invitation
                }
            })

            return await rep.send({
                rep: {
                    ret: 0,
                    msg: ""
                }
            })
        }
    })
}