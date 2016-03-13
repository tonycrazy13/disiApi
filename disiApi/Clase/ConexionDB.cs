using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Oracle.DataAccess.Client;

namespace DisiStatic.Class
{
    public class ConexionDB
    {
        public OracleConnection conn;
        private static OracleConnection connection1 = new OracleConnection();
        private static OracleConnection connection2
        {
            get { return ConexionDB.connection1; }
            set { ConexionDB.connection1 = value; }
        }

        public static void dataSourcePath()
        {
            connection2.ConnectionString = "Data Source=" + "Luis VSP" + "; User Id=" + "disi" + "; Password=" + "vision123" + ";";
        }

        public String getPathDataSource()
        {
            String path = "Data Source=" + "Luis VSP" + "; User Id=" + "disi" + "; Password=" + "vision123" + ";";
            return path;
        }

        public bool Conecta(string server,string usuario, string pass)
        {
            try
            {
                conn = new OracleConnection(getPathDataSource());
                conn.Open();
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public bool Desconecta(string server, string usuario, string pass)
        {
            try
            {
                conn.Close();
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

    }
}