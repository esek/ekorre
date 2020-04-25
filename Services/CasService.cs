namespace ekorre.Services
{
    public interface ICasService
    {
        bool IsLUStudent();   
    }

    public class CasService : ICasService
    {
        public bool IsLUStudent()
        {
            return true;
        }
    }

}