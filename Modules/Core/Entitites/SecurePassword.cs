namespace Ekorre.Core.Entities
{
    public struct SecurePassword
    {
        public byte[] HashedPassword { get; set; }
        public byte[] Salt { get; set; }

        public SecurePassword(byte[] hashedPassword, byte[] salt)
        {
            HashedPassword = hashedPassword;
            Salt = salt;
        }
    }
}