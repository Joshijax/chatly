const openai = require("openai");
const fs = require("fs");
const { promisify } = require("util");
const sleep = promisify(setTimeout);

async function run() {
  // Define OpenAI API key and model name
  openai.api_key = "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";
  const model_name = "text-davinci-002";

  // Load the training data from a JSON file
  const training_data = JSON.parse(fs.readFileSync("training_data.json"));

  // Define the training configuration
  const batch_size = 32;
  const learning_rate = 5e-5;
  const num_epochs = 3;

  const training_config = {
    model: model_name,
    dataset: {
      data: training_data,
      data_type: "text",
    },
    parameters: {
      batch_size: batch_size,
      learning_rate: learning_rate,
      epochs: num_epochs,
    },
  };

  // Start the training
  const { data: training_id } = await openai.FineTune.create(training_config);

  // Monitor training progress
  while (true) {
    const { data: status } = await openai.FineTune.retrieve(training_id);
    if (status.status === "succeeded") {
      break;
    } else if (status.status === "failed") {
      throw new Error("Training failed: " + status.error);
    }

    // Print training progress
    console.log(
      `Epoch: ${status.epoch}, Step: ${status.step}, Loss: ${status.loss}`
    );

    // Wait for some time before checking status again
    await sleep(30000);
  }

  // Save the trained model to a file
  const response = await openai.Model.retrieve(model_name);
  await response.saveToDirectory("trained_model");
}

run();
