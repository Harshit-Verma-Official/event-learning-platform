import { Kafka } from "kafkajs";

export const kafka = new Kafka({
  clientId: "auth-service",
  brokers: [process.env.KAFKA_BROKERS!],
});

export const producer = kafka.producer();
