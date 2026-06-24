catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ System error: ${err.message}. Please check your API key in the \`.env\` file.`,
          id: Date.now() + 1,
        },
      ]);
    }


    : ${err.message}. Please check your API key in the \`.env\` file.