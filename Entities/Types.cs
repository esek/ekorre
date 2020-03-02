namespace ekorre.Entities {
    public enum RoleId {
        // Generella roller
        medlem, funtionär, vice, styrelse, admin, sudo,
        // Poster
        macapär
    }

    public static class Roles {
        public const string MEMBER = "member";
    }

    public struct Role {
        public RoleId Id { get; set; }
        public string Name { get; set; }
    }

    public enum MemberGroups {

    }
}