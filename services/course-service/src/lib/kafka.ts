import { Kafka } from "kafkajs";

export const kafka = new Kafka({
  clientId: "course-service",
  brokers: [process.env.KAFKA_BROKERS!],
});

export const producer = kafka.producer();

export const consumer = kafka.consumer({
  groupId: "course-service-user-events",
});
