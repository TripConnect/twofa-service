import { Kafka } from "kafkajs";

const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'localhost:9092').split(",")

export default new Kafka({
    clientId: 'twofa-service',
    brokers: KAFKA_BROKERS
});
