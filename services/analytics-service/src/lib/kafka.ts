import { Kafka } from "kafkajs";

export const kafka = new Kafka({
  clientId: "analytics-service",
  brokers: [process.env.KAFKA_BROKERS!],
});

export const courseConsumer = kafka.consumer({
  groupId: "analytics-course-group",
});
