using Dapper;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace generatejson
{
    class Program
    {
        static void Main(string[] args)
        {
            var connectionString = ConfigurationManager.ConnectionStrings["KenGranderson"].ConnectionString;
            var sql = "SELECT Year, Title, SubTitle, Description, Media, PostScript FROM Highlights";
            var fileName = @"C:\Users\Ken.CMUCORP\source\repos\kengranderson\KenGranderson\highlights.json";

            using (var db = new SqlConnection(connectionString))
            {
                var items = db.Query<HighlightItem>(sql, CommandType.Text).ToList();
                foreach (var item in items)
                {
                    item.mediaUrls = item.media?.Split(',').Select(m => !m.Contains(".") ? m : $"images/highlights/{m}").ToList();
                }

                var groupedItems = items.GroupBy(i => i.year).ToDictionary(i => i.Key,  i => i.Select(z => z));


                var json = JsonConvert.SerializeObject(groupedItems, Formatting.Indented,
                    new JsonSerializerSettings { NullValueHandling = NullValueHandling.Ignore });
                File.WriteAllText(fileName, json);
            }
        }
    }
}
