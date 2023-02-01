import fastify from "fastify";
import { PrismaClient } from '@prisma/client'
import redis from 'redis'

export const server = fastify({ logger: {
    prettifier: true
}})

export const prisma = new PrismaClient()

export const redisClient = redis.createClient()