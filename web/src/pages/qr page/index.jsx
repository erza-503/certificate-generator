import { useEffect, useState } from "react";
import { Sertifikat } from "../api middleware";
import { message, Modal,Spin ,Button } from "antd";
import { useParams } from "react-router-dom";

const CertificateTable = () => {
  const { id } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
   const [isModalVisible, setIsModalVisible] = useState(false);
   const [selectedDownload, setSelectedDownload] = useState(null);

 const downloadPDF = async (_id, type) => {
   setLoading(true);
   try {
     const response = await Sertifikat.get(`/download/${_id}/${type}`, {
       headers: {
         "Content-Type": "application/pdf",
       },
       responseType: "blob",
     });
   
     // Membuat link untuk mengunduh file
     const url = window.URL.createObjectURL(new Blob([response.data]));
     const link = document.createElement("a");
     link.href = url;
     link.setAttribute("download", `${_id}.pdf`); // Nama file saat diunduh
     document.body.appendChild(link);
     link.click();
     link.remove(); // Hapus link setelah digunakan
   } catch (error) {
     console.error("Error downloading PDF:", error);
   } finally {
     setLoading(false);
   }
 };

  const handleDownloadClick = (record) => {
    setSelectedDownload(record); // Simpan record yang dipilih ke dalam state
    setIsModalVisible(true); // Tampilkan modal
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await Sertifikat.get(`/data_id/${id}`);
        const certData = response.data.data;
        if (!certData.deleted_at) {
          setCertificate(certData);
        } else {
          message.warning("Data sertifikat tidak tersedia.");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Gagal memuat data sertifikat.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

	if (loading) {
		return <div className="text-center py-10 text-xl">Loading...</div>;
	}

	if (error) {
		return <div className="text-center text-red-600 py-10">{error}</div>;
	}

  return (
    <div className="p-4 sm:p-10">
      <h1 className="text-2xl sm:text-2xl font-bold text-center mb-8 text-[#15467a]">
        Verifikasi Sertifikat
      </h1>
      <div className="max-w-3xl mx-auto bg-white overflow-hidden text-[12px]">
        <div className="bg-[#15467a] text-white text-center py-3 sm:py-4 font-semibold"></div>
        <div className="grid sm:grid-cols-2 grid-cols-1 gap-0 border border-gray-300">
          {/* Row 1 */}
          <div className="sm:p-4 pt-4 px-8 bg-[#f8fafc] font-bold border-t sm:border-r">
            No. Sertifikat
          </div>
          <div className="sm:p-4 pb-4 px-8 bg-[#f8fafc] border-b ">
            {`S.${certificate?.data?.kode_referral?.referral_id}/${certificate?.data?.kode_referral?.divisi}/LKP-BTW/${certificate?.data?.kode_referral?.bulan_rilis}/${certificate?.data?.kode_referral?.tahun_rilis}`}
          </div>

					{/* Row 2 */}
					<div className="sm:p-4 pt-4 px-8 bg-[#f1f3f4] font-bold border-t sm:border-r">ID Sertifikat</div>
					<div className="sm:p-4 pb-4 px-8 border-b bg-[#f1f3f4]">
						<span className="bg-gray-200 px-2 py-1 rounded">{certificate?.data?.data_id}</span>
					</div>

					{/* Row 3 */}
					<div className="sm:p-4 pt-4 px-8 bg-[#f8fafc] font-bold border-t sm:border-r">Nama Peserta</div>
					<div className="sm:p-4 pb-4 px-8 border-b bg-[#f8fafc]">{certificate?.data?.nama_peserta}</div>

					{/* Row 4 */}
					<div className="sm:p-4 pt-4 px-8 bg-[#f1f3f4] font-bold border-t sm:border-r">Bidang Kompetensi</div>
					<div className="sm:p-4 pb-4 px-8 border-b bg-[#f1f3f4]">{certificate?.data?.kompeten_bidang}</div>

					{/* Row 5 */}
					<div className="sm:p-4 pt-4 px-8 bg-[#f8fafc] font-bold border-t sm:border-r">Kompetensi</div>
					<div className="sm:p-4 pb-4 px-8 border-b bg-[#f8fafc]">{certificate?.data?.kompetensi}</div>

					{/* Row 6 */}
					<div className="sm:p-4 pt-4 px-8 bg-[#f1f3f4] font-bold border-t sm:border-r">Masa Berlaku</div>
					<div className="sm:p-4 pb-4 px-8 border-b bg-[#f1f3f4]">{`${certificate?.data?.valid_date?.valid_start} s/d ${certificate?.data?.valid_date?.valid_end}`}</div>

          {/* Row 7 */}
          <div className="sm:p-4 pt-4 px-8 bg-[#f8fafc] font-bold sm:border-r">
            Lihat Sertifikat
          </div>
          <div className="sm:p-4 pb-4 px-8 py-2 bg-[#f8fafc]">
            <button
              onClick={() => handleDownloadClick(certificate)}
              className="bg-green-500 text-white px-4 py-2 hover:bg-green-600"
            >
              Lihat Sertifikat
            </button>
          </div>
        </div>
      </div>
      <Modal
        title=""
        open={isModalVisible}
        footer={null}
        onCancel={() => setIsModalVisible(false)}
        className="rounded-lg p-6 max-w-lg w-full"
        centered
      >
        <div className="flex flex-col items-center space-y-4">
          <Spin spinning={loading}>
            <p className="text-lg font-semibold text-gray-700">
              Silakan pilih template untuk diunduh:
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full">
              <Button
                type="primary"
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg w-full sm:w-auto"
                onClick={() => downloadPDF(selectedDownload?.data_id, "a")}
              >
                Download Template V1
              </Button>
              <Button
                type="primary"
                className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg w-full sm:w-auto"
                onClick={() => downloadPDF(selectedDownload?.data_id, "b")}
              >
                Download Template V2
              </Button>
            </div>
          </Spin>
        </div>
      </Modal>
    </div>
  );
};

export default CertificateTable;
