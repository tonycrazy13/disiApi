using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.ComponentModel.DataAnnotations; 
using System.ComponentModel.DataAnnotations.Schema;

namespace disiApi.Models
{
    public class Cat_Sucursales
    {
        public int sucursalId { get; set; }
        public string tituloSucursal { get; set; }
        public string subTituloSucursale { get; set; }
        public string desMarcacion { get; set; }
        public string tel1 { get; set; }
        public string tel2 { get; set; }
        public string tel3 { get; set; }
        public bool fagActivo { get; set; }
    }
}