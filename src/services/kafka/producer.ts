import kafkajs, { Kafka, Producer } from "kafkajs";

import kafka from "../kafka";

type PublishPayload = {
    topic: string,
    message: string,
}

class KafkaProducer {
    private static producer: Producer | null = null;

    constructor(private kafka: Kafka) { }

    private async initialize(): Promise<void> {
        const producer = this.kafka.producer({ createPartitioner: kafkajs.Partitioners.LegacyPartitioner });
        await producer.connect();
        KafkaProducer.producer = producer;
    }

    public async publish(params: PublishPayload): Promise<void> {
        if (KafkaProducer.producer === null) {
            await this.initialize();
        }
        KafkaProducer.producer!.send({
            topic: params.topic,
            messages: [
                { value: params.message }
            ]
        });
    }
}

export default new KafkaProducer(kafka);
