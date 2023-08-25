import * as Batch from "@aws-sdk/client-batch";
const batchClient = new Batch.BatchClient();

// キューへのジョブの送信
const submitJobRequest = async (
  input: Batch.SubmitJobCommandInput
): Promise<Batch.SubmitJobCommandOutput | false> => {
  const jobCommand = new Batch.SubmitJobCommand(input);
  try {
    const response = await batchClient.send(jobCommand);
    console.log(response);
    return response;
  } catch (e) {
    console.error(e);
    return false;
  }
};

// 送信したジョブ情報の取得
const describeJobsCommand = async (jobIds: string[]): Promise<boolean> => {
  const input: Batch.DescribeJobsCommandInput = { jobs: jobIds };
  const command = new Batch.DescribeJobsCommand(input);
  try {
    const response = await batchClient.send(command);
    console.log(response);
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};

// 送信したジョブのキャンセル
const cancelJobCommand = async (jobId: string): Promise<boolean> => {
  const input: Batch.CancelJobCommandInput = {
    jobId: jobId,
    reason: "Cancelling job.",
  };
  const command = new Batch.CancelJobCommand(input);
  try {
    const response = await batchClient.send(command);
    console.log(response);
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};

// キューに格納されたジョブの取得
const listJobsCommand = async (jobQueue: string): Promise<boolean> => {
  const input: Batch.ListJobsCommandInput = {
    jobQueue: jobQueue,
  };
  const command = new Batch.ListJobsCommand(input);
  try {
    const response = await batchClient.send(command);
    console.log(response);
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};

// AWS Batch コマンドの実行
const runAll = async (): Promise<void> => {
  const jobQueue = "test-queue";
  const input: Batch.SubmitJobCommandInput = {
    jobName: "test-job",
    jobDefinition: "test-job-definition",
    jobQueue: jobQueue,
    containerOverrides: {
      command: ["echo", "hello world"],
      environment: [{ name: "NAME", value: "VALUE" }],
      resourceRequirements: [
        { type: "MEMORY", value: "512" },
        { type: "VCPU", value: "0.25" },
        // 512, 1024, 2048
        // { type: "MEMORY", value: "512" },
        // { type: "VCPU", value: "0.25" },
        // 1024, 2048, 3072, 4096
        // { type: "MEMORY", value: "1024" },
        // { type: "VCPU", value: "0.5" },
        // 2048, 3072, 4096, 5120, 6144, 7168, 8192
        // { type: "MEMORY", value: "2048" },
        // { type: "VCPU", value: "1" },
        // 4096, 5120, 6144, 7168, 8192, 9216, 10240, 11264, 12288, 13312, 14336, 15360, 16384
        // { type: "MEMORY", value: "4096" },
        // { type: "VCPU", value: "2" },
        // 8192, 9216, 10240, 11264, 12288, 13312, 14336, 15360, 16384, 17408, 18432, 19456, 20480, 21504, 22528, 23552, 24576, 25600, 26624, 27648, 28672, 29696, 30720
        // { type: "MEMORY", value: "8192" },
        // { type: "VCPU", value: "4" },
        // 16384, 20480, 24576, 28672, 32768, 36864, 40960, 45056, 49152, 53248, 57344, 61440
        // { type: "MEMORY", value: "16384" },
        // { type: "VCPU", value: "8" },
        // 32768, 40960, 49152, 57344, 65536, 73728, 81920, 90112, 98304, 106496, 114688, 122880
        // { type: "MEMORY", value: "32768" },
        // { type: "VCPU", value: "16" },
      ],
    },
  };
  console.log("SubmitJobRequest:");
  const response = await submitJobRequest(input);
  if (!response || !response.jobId) return;
  console.log("DescribeJobsCommand:");
  await describeJobsCommand([response.jobId]);
  console.log("ListJobsCommand");
  await listJobsCommand(jobQueue);
  console.log("CancelJobCommand:");
  await cancelJobCommand(response.jobId);
};
runAll();
