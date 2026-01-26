namespace Backend.Utils
{
    using dotenv.net;

    public static class EnvUtils
    {
        public static void LoadEnvFile()
        {
            var envPath = Path.GetFullPath(
                Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".env")
            );
            DotEnv.Load(options: new DotEnvOptions(envFilePaths: [envPath]));
        }
    }
}