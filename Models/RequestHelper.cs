using System;
using System.Linq;
using System.Reflection;
using System.ComponentModel.DataAnnotations;

namespace ekorre.Models
{
    public class RequestHelper {
        public static string Describe<T>() {
            var t = typeof(T).GetProperties();
            Attribute attribute;
            string outStr = "{";
            string typeStr;


            foreach (var prop in t)
            {
                typeStr = prop.PropertyType.ToString();
                attribute = prop.GetCustomAttributes(typeof(RequiredAttribute), false).FirstOrDefault() as RequiredAttribute;

                typeStr = typeStr.Split('.').Last();
                outStr += String.Format("{0}: {1} {2}", prop.Name, typeStr, attribute != null ? "[required]" : "");
            }

            return outStr + "}";
        }
    }
}