import { Kafka } from "kafkajs";

export const kafka = new Kafka({
  clientId: "notification-service",
  brokers: [process.env.KAFKA_BROKERS!],
});

export const consumer = kafka.consumer({
  groupId: "notification-group",
});

export const userConsumer = kafka.consumer({
  groupId: "notification-user-group",
});
