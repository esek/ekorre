using System.Linq;

namespace ekorre.Entities
{
    public static class Roles {
        private static string[] roles;
        public static string OFFICAL = "Funktionär";

        public static bool IsValidRole(string role) {
            return GetRoles().Contains(role);
        }

        public static string[] GetRoles()
        {
            if (roles != null) return roles;

            var t = typeof(Roles).GetFields();
            var s = new string[t.Length];

            for (int i = 0; i < t.Length; i++)
            {
                s[i] = t[i].GetValue(null) as string;
            }

            roles = s;

            return s;
        }
    }
}