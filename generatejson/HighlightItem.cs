using Newtonsoft.Json;
using System.Collections.Generic;

namespace generatejson
{
    class HighlightItem
    {
        [JsonIgnore]
        public int year { get; set; }
        public string title { get; set; }
        public string subTitle { get; set; }
        public string description { get; set; }

        [JsonIgnore]
        public string media { get; set; }
        public IEnumerable<string> mediaUrls { get; set; }
        public string postscript { get; set; }
    }
}
