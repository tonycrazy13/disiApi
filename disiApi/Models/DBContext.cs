using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

using System.Data.Entity;

namespace disiApi.Models
{
    public class DBContext : DBContext
    {
        public DbSet<Cat_Sucursales> Customers { get; set; }
    }
}